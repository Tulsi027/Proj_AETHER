const { extractFactors } = require('./agents/analyst');
const { generateAdvocateArgument } = require('./agents/advocate');
const { generateSkepticCounter } = require('./agents/skeptic');
const { synthesizeDebate, generateFinalReport } = require('./agents/scribe');

class DebateCoordinator {
  constructor() {
    this.state = 'IDLE';
    this.currentReport = null;
    this.factors = [];
    this.debates = [];
    this.finalReport = null;
  }

  async processReport(reportData, onProgress) {
    try {
      // Handle both text and image inputs
      const reportText = reportData.type === 'image' ? reportData.text : reportData.text;
      const isImage = reportData.type === 'image';
      
      // STATE 1: FACTOR EXTRACTION
      this.state = 'EXTRACTING_FACTORS';
      onProgress({ 
        state: this.state, 
        message: isImage ? '🔍 The Decipherer is analyzing the image/chart...' : '🔍 The Decipherer is analyzing the report...'
      });
      
      this.currentReport = reportText;
      this.factors = await extractFactors(reportData);
      
      onProgress({ 
        state: this.state, 
        message: `✅ Found ${this.factors.length} key factors`,
        data: { factors: this.factors }
      });

      // STATE 2-5: DEBATE EACH FACTOR
      for (let i = 0; i < this.factors.length; i++) {
        const factor = this.factors[i];
        
        try {
          // Add delay between factors to avoid rate limits
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
          }
          
          // STATE 2: ADVOCATE OPENING
          this.state = 'ADVOCATE_ARGUING';
          onProgress({ 
            state: this.state, 
            message: `💚 The Advocate is arguing for "${factor.name}"...`,
            data: { currentFactor: i + 1, totalFactors: this.factors.length }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay before API call
          const advocateArg = await generateAdvocateArgument(factor, reportText);
          
          onProgress({
            state: this.state,
            message: `✅ Advocate: "${advocateArg.claim}"`,
            data: { advocateArgument: advocateArg }
          });

          // STATE 3: SKEPTIC COUNTER
          this.state = 'SKEPTIC_COUNTERING';
          onProgress({ 
            state: this.state, 
            message: `🔴 The Skeptic is challenging the Advocate...`
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay before API call
          const skepticArg = await generateSkepticCounter(factor, advocateArg, reportText);
          
          onProgress({
            state: this.state,
            message: `✅ Skeptic: "${skepticArg.counter_argument}"`,
            data: { skepticArgument: skepticArg }
          });

          // STATE 4: SYNTHESIS
          this.state = 'SYNTHESIZING';
          onProgress({ 
            state: this.state, 
            message: `⚖️ The Scribe is judging the debate...`
          });
          
          await new Promise(resolve => setTimeout(resolve, 8000)); // 8 second delay to avoid rate limit
          const synthesis = await synthesizeDebate(factor, advocateArg, skepticArg, reportText);
          
          this.debates.push({
            factor,
            advocate: advocateArg,
            skeptic: skepticArg,
            synthesis
          });

          onProgress({
            state: this.state,
            message: `✅ Verdict: ${synthesis.verdict}`,
            data: { synthesis, debate: this.debates[i] }
          });
        } catch (error) {
          // Check if it's a rate limit error
          const isRateLimit = error.message.includes('429') || 
                              error.message.includes('rate_limit') || 
                              error.message.includes('Rate limit') ||
                              error.message.includes('API returned undefined');
          
          if (isRateLimit && this.debates.length > 0) {
            // Rate limit hit, but we have some completed debates
            console.log(`Rate limit hit at factor ${i + 1}. Generating report with ${this.debates.length} completed factors.`);
            onProgress({
              state: 'RATE_LIMIT_REACHED',
              message: `⚠️ Rate limit reached. Generating report with ${this.debates.length} completed factors...`
            });
            break; // Exit loop and generate report with what we have
          } else {
            // Either not a rate limit error, or no debates completed yet
            throw error;
          }
        }
      }

      // STATE 6: FINAL REPORT (Generate locally without API call to avoid rate limits)
      this.state = 'GENERATING_FINAL_REPORT';
      
      const completedFactors = this.debates.length;
      const totalFactors = this.factors.length;
      const isPartial = completedFactors < totalFactors;
      
      onProgress({ 
        state: this.state, 
        message: isPartial 
          ? `📝 Generating report from ${completedFactors}/${totalFactors} completed factors...`
          : '📝 Generating final report from debate results...'
      });

      const syntheses = this.debates.map(d => d.synthesis);
      
      // Generate final report from synthesis data without API call
      this.finalReport = {
        executive_summary: `Analysis of ${completedFactors} ${isPartial ? `out of ${totalFactors}` : ''} key factors from the report. ${
          isPartial 
            ? `⚠️ Note: Analysis stopped at factor ${completedFactors} due to rate limits. Results below are based on completed factors only.` 
            : ''
        } ${
          syntheses.filter(s => s.verdict && s.verdict.toLowerCase().includes('concerning')).length > 0
            ? 'Several concerns identified requiring immediate attention.'
            : 'Overall performance shows areas of strength with opportunities for improvement.'
        }`,
        key_findings: syntheses.flatMap(s => [
          ...s.what_worked.map(w => `✅ ${w}`),
          ...s.what_failed.map(f => `❌ ${f}`)
        ]).slice(0, 8),
        top_priorities: syntheses.flatMap(s => s.how_to_improve).slice(0, 5),
        overall_assessment: syntheses.map(s => s.verdict).join(' | '),
        factors_analyzed: completedFactors,
        total_factors: totalFactors,
        is_partial: isPartial
      };

      this.state = 'COMPLETE';
      onProgress({ 
        state: this.state, 
        message: this.finalReport.is_partial 
          ? `✅ Partial analysis complete! Analyzed ${this.finalReport.factors_analyzed}/${this.finalReport.total_factors} factors.`
          : '✅ Analysis complete!',
        data: { 
          debates: this.debates,
          finalReport: this.finalReport
        }
      });

      return {
        factors: this.factors,
        debates: this.debates,
        finalReport: this.finalReport
      };

    } catch (error) {
      this.state = 'ERROR';
      onProgress({ 
        state: this.state, 
        message: `❌ Error: ${error.message}`
      });
      throw error;
    }
  }
}

module.exports = { DebateCoordinator };