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

  async processReport(reportText, onProgress) {
    try {
      // STATE 1: FACTOR EXTRACTION
      this.state = 'EXTRACTING_FACTORS';
      onProgress({ state: this.state, message: '🔍 The Decipherer is analyzing the report...' });
      
      this.currentReport = reportText;
      this.factors = await extractFactors(reportText);
      
      onProgress({ 
        state: this.state, 
        message: `✅ Found ${this.factors.length} key factors`,
        data: { factors: this.factors }
      });

      // STATE 2-5: DEBATE EACH FACTOR
      for (let i = 0; i < this.factors.length; i++) {
        const factor = this.factors[i];
        
        // STATE 2: ADVOCATE OPENING
        this.state = 'ADVOCATE_ARGUING';
        onProgress({ 
          state: this.state, 
          message: `💚 The Advocate is arguing for "${factor.name}"...`,
          data: { currentFactor: i + 1, totalFactors: this.factors.length }
        });
        
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
      }

      // STATE 6: FINAL REPORT
      this.state = 'GENERATING_FINAL_REPORT';
      onProgress({ 
        state: this.state, 
        message: '📝 The Scribe is writing the final report...'
      });

      const syntheses = this.debates.map(d => d.synthesis);
      this.finalReport = await generateFinalReport(syntheses, reportText);

      this.state = 'COMPLETE';
      onProgress({ 
        state: this.state, 
        message: '✅ Analysis complete!',
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