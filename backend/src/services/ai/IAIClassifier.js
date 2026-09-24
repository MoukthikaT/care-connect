/**
 * Abstract AI Classifier Interface
 * Contract to be implemented by RuleBasedClassifier (Phase 3) or GeminiAIAdapter (Future)
 */
export class IAIClassifier {
  /**
   * Classify a raw natural language customer service request
   * @param {string} textDescription 
   * @param {Array<string>} [attachments] 
   * @returns {Promise<{ suggestedCategory: string, detectedSkills: string[], urgency: string, complexityScore: number, confidenceScore: number }>}
   */
  async classifyRequest(textDescription, attachments = []) {
    throw new Error("Method 'classifyRequest()' must be implemented by subclass.");
  }
}

export default IAIClassifier;
