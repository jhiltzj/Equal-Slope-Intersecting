/**
 * Rafter Framing Math Generator - Core Logic (Multi-Question Engine)
 * Renders all 17 rafter calculation questions at once for a generated building scenario.
 */

// Utility functions for random numbers and formatting
const RafterMath = {
    // Generate random integer between min and max inclusive
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Convert feet and inches to total inches
    toTotalInches(feet, inches = 0) {
        return feet * 12 + inches;
    },

    // Convert total inches to feet + inches string (e.g. 24' 6 1/2" or 24' 6")
    formatFeetInches(totalInches) {
        if (totalInches == null || isNaN(totalInches)) return "0' 0\"";
        
        const isNegative = totalInches < 0;
        const absInches = Math.abs(totalInches);
        let feet = Math.floor(absInches / 12);
        let remInches = absInches % 12;
        
        let wholeInches = Math.floor(remInches);
        let fractionInches = remInches - wholeInches;
        
        // Round to nearest 1/16th inch
        let sixteenths = Math.round(fractionInches * 16);
        if (sixteenths === 16) {
            wholeInches += 1;
            sixteenths = 0;
            if (wholeInches === 12) {
                feet += 1;
                wholeInches = 0;
            }
        }

        let fracStr = "";
        if (sixteenths > 0) {
            let numerator = sixteenths;
            let denominator = 16;
            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            const div = gcd(numerator, denominator);
            numerator /= div;
            denominator /= div;
            fracStr = ` ${numerator}/${denominator}`;
        }

        const inchStr = (wholeInches === 0 && fracStr !== "") ? fracStr.trim() : `${wholeInches}${fracStr}`;
        const result = `${feet}' ${inchStr}"`;
        return isNegative ? `-${result}` : result;
    },

    // Format decimal feet (e.g. 24.50 ft)
    formatDecimalFeet(totalInches) {
        const feet = totalInches / 12;
        return feet.toFixed(3) + " ft";
    },

    // Format decimal inches (e.g. 294.00 in)
    formatDecimalInches(totalInches) {
        return totalInches.toFixed(2) + '"';
    },

    // Flexible Parser for student input (feet-inches, decimal feet, decimal inches, fractions)
    parseInputToInches(inputStr) {
        if (!inputStr) return null;
        let str = inputStr.trim().toLowerCase().replace(/ft|feet/g, "'").replace(/in|inch|inches/g, '"');
        
        const ftInchRegex = /^(-?\d+)\s*(?:'|ft|-|\s)\s*(\d+)?(?:\s+(\d+)\/(\d+))?\s*"?$/;
        const match = str.match(ftInchRegex);

        if (match) {
            const feet = parseInt(match[1], 10) || 0;
            const inches = parseInt(match[2], 10) || 0;
            const num = parseInt(match[3], 10) || 0;
            const den = parseInt(match[4], 10) || 1;
            const frac = num / den;
            return (feet * 12) + inches + frac;
        }

        const fracRegex = /^(\d+)?\s*(\d+)\/(\d+)\s*"??$/;
        const fracMatch = str.match(fracRegex);
        if (fracMatch) {
            const whole = parseInt(fracMatch[1], 10) || 0;
            const num = parseInt(fracMatch[2], 10) || 0;
            const den = parseInt(fracMatch[3], 10) || 1;
            return whole + (num / den);
        }

        const cleanNum = str.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed)) {
            return parsed;
        }

        return null;
    }
};

// Application State
const RafterApp = {
    params: {},
    questionsList: [],
    questionStates: {},

    // Generate parameters meeting all 7 given rules
    generateParameters() {
        const bFeet = RafterMath.randomInt(30, 64);
        const bInches = RafterMath.randomInt(0, 11);
        const buildingLengthInches = RafterMath.toTotalInches(bFeet, bInches);

        let majFeet = RafterMath.randomInt(16, Math.min(40, bFeet - 1));
        let majInches = RafterMath.randomInt(0, 11);
        let majorSpanInches = RafterMath.toTotalInches(majFeet, majInches);
        if (majorSpanInches >= buildingLengthInches) {
            majorSpanInches = buildingLengthInches - 12;
            majFeet = Math.floor(majorSpanInches / 12);
            majInches = majorSpanInches % 12;
        }

        const maxMinFeet = Math.min(30, majFeet - 1);
        const minFeet = RafterMath.randomInt(12, Math.max(12, maxMinFeet));
        let minInches = RafterMath.randomInt(0, 11);
        let minorSpanInches = RafterMath.toTotalInches(minFeet, minInches);
        if (minorSpanInches >= majorSpanInches) {
            minorSpanInches = majorSpanInches - 12;
        }

        const maxOffsetInches = (buildingLengthInches - 60) - minorSpanInches - 1;
        const minOffsetInches = 12;
        // Must also be less than half the Major Span
        const halfMajorSpanLimit = Math.ceil(majorSpanInches / 2) - 1;
        const safeMaxOffset = Math.max(minOffsetInches, Math.min(maxOffsetInches, halfMajorSpanLimit));
        const minorOffsetInches = RafterMath.randomInt(minOffsetInches, safeMaxOffset);

        const projFeet = RafterMath.randomInt(6, 12);
        const projInches = RafterMath.randomInt(0, 11);
        const minorProjectionInches = RafterMath.toTotalInches(projFeet, projInches);

        const slopes = [
            { rise: 4, run: 12, ratioText: "4/12 (or 1:3)" },
            { rise: 5, run: 12, ratioText: "5/12" },
            { rise: 6, run: 12, ratioText: "6/12 (or 1:2)" },
            { rise: 7, run: 12, ratioText: "7/12" },
            { rise: 8, run: 12, ratioText: "8/12 (or 2:3)" },
            { rise: 9, run: 12, ratioText: "9/12 (or 3:4)" },
            { rise: 10, run: 12, ratioText: "10/12 (or 5:6)" },
            { rise: 11, run: 12, ratioText: "11/12" },
            { rise: 12, run: 12, ratioText: "12/12 (or 1:1)" }
        ];
        const roofSlope = slopes[RafterMath.randomInt(0, slopes.length - 1)];

        const ocSpacing = RafterMath.randomInt(0, 1) === 0 ? 16 : 24;

        const possibleValues = [];
        for (let i = 9; i <= ocSpacing; i++) {
            possibleValues.push(i);
        }
        for (let i = possibleValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleValues[i], possibleValues[j]] = [possibleValues[j], possibleValues[i]];
        }
        const paramA = possibleValues[0];
        const paramB = possibleValues[1];
        const paramC = possibleValues[2];
        const paramD = possibleValues[3];

        const riseOverRun = roofSlope.rise / roofSlope.run;
        const sgf90 = Math.sqrt(Math.pow(riseOverRun, 2) + 1);
        const sgf45 = Math.sqrt(Math.pow(riseOverRun, 2) + 2);

        this.params = {
            buildingLengthInches,
            majorSpanInches,
            minorOffsetInches,
            minorSpanInches,
            minorProjectionInches,
            roofSlope,
            ocSpacing,
            paramA,
            paramB,
            paramC,
            paramD,
            sgf90,
            sgf45
        };

        this.displayParameters();
        this.questionsList = this.getQuestions();
        this.renderAllQuestionsUI();
    },

    displayParameters() {
        const p = this.params;
        const pContainer = document.getElementById('parameters-list');
        if (!pContainer) return;

        pContainer.innerHTML = `
            <div class="param-card"><span class="param-label">1. Building Length:</span> <span class="param-val">${RafterMath.formatFeetInches(p.buildingLengthInches)}</span></div>
            <div class="param-card"><span class="param-label">2. Major Span:</span> <span class="param-val">${RafterMath.formatFeetInches(p.majorSpanInches)}</span></div>
            <div class="param-card"><span class="param-label">3. Minor Offset from Corner:</span> <span class="param-val">${RafterMath.formatFeetInches(p.minorOffsetInches)}</span></div>
            <div class="param-card"><span class="param-label">4. Minor Span:</span> <span class="param-val">${RafterMath.formatFeetInches(p.minorSpanInches)}</span></div>
            <div class="param-card"><span class="param-label">5. Minor Wall Projection:</span> <span class="param-val">${RafterMath.formatFeetInches(p.minorProjectionInches)}</span></div>
            <div class="param-card"><span class="param-label">6. Roof Slope:</span> <span class="param-val highlight-slope">${p.roofSlope.ratioText}</span></div>
            <div class="param-card"><span class="param-label">7. On Center (O.C.) Spacing:</span> <span class="param-val">${p.ocSpacing}" O.C.</span></div>
            <div class="param-card param-sub-group">
                <span class="param-label">Parameters (A, B, C, D):</span> 
                <span class="param-val">A = ${p.paramA}", B = ${p.paramB}", C = ${p.paramC}", D = ${p.paramD}"</span>
            </div>
        `;
    },

    // Definitions of all 17 Questions
    getQuestions() {
        const p = this.params;
        
        return [
            // Q1
            {
                id: 1,
                title: "1. What is your 90 degree SGF?",
                type: "single",
                unitType: "factor",
                targetValue: p.sgf90,
                formula: `SGF (90°) = √((Rise / Run)² + 1)`,
                explanation: `SGF (90°) = √((${p.roofSlope.rise} / ${p.roofSlope.run})² + 1) = √((${ (p.roofSlope.rise/p.roofSlope.run).toFixed(4) })² + 1) = ${p.sgf90.toFixed(4)}`
            },
            // Q2
            {
                id: 2,
                title: "2. What is your 45 degree SGF?",
                type: "single",
                unitType: "factor",
                targetValue: p.sgf45,
                formula: `SGF (45°) = √((Rise / Run)² + 2)`,
                explanation: `SGF (45°) = √((${p.roofSlope.rise} / ${p.roofSlope.run})² + 2) = √((${ (p.roofSlope.rise/p.roofSlope.run).toFixed(4) })² + 2) = ${p.sgf45.toFixed(4)}`
            },
            // Q3
            {
                id: 3,
                title: "3. What is the Line Length of the Common Rafter on Major roof?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.majorSpanInches * p.sgf90,
                formula: `Common Rafter Line Length = ½ × Major Span × 90° SGF`,
                explanation: `Half Major Span = ½ × ${RafterMath.formatFeetInches(p.majorSpanInches)} = ${RafterMath.formatFeetInches(0.5 * p.majorSpanInches)} (${(0.5 * p.majorSpanInches / 12).toFixed(3)} ft)\nLine Length = ${(0.5 * p.majorSpanInches / 12).toFixed(3)} ft × ${p.sgf90.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.majorSpanInches * p.sgf90)} (${(0.5 * p.majorSpanInches * p.sgf90 / 12).toFixed(3)} ft)`
            },
            // Q4
            {
                id: 4,
                title: "4. Major Hip Jack Common Difference",
                type: "single",
                unitType: "length_inches_or_feet",
                targetInches: p.ocSpacing * p.sgf90,
                formula: `Major Hip Jack Common Difference = On Center Spacing × 90° SGF`,
                explanation: `OC Spacing = ${p.ocSpacing}"\nCommon Difference = ${p.ocSpacing}" × ${p.sgf90.toFixed(4)} = ${ (p.ocSpacing * p.sgf90).toFixed(3) }" (${RafterMath.formatFeetInches(p.ocSpacing * p.sgf90)})`
            },
            // Q5
            {
                id: 5,
                title: "5. If laid out from corner, what would the 1st, 2nd, and 3rd Major Hip Jacks be?",
                type: "triple",
                unitType: "length_feet",
                targetInches1: 1 * (p.ocSpacing * p.sgf90),
                targetInches2: 2 * (p.ocSpacing * p.sgf90),
                targetInches3: 3 * (p.ocSpacing * p.sgf90),
                formula: `Jack Length = Number of Rafters in × Major Hip Jack Common Difference\nWhere Common Difference = O.C. Spacing × 90° SGF`,
                explanation: `Common Difference = ${p.ocSpacing}" × ${p.sgf90.toFixed(4)} = ${(p.ocSpacing * p.sgf90).toFixed(3)}"\n1st Jack (1 in) = 1 × ${(p.ocSpacing * p.sgf90).toFixed(3)}" = ${RafterMath.formatFeetInches(1 * p.ocSpacing * p.sgf90)}\n2nd Jack (2 in) = 2 × ${(p.ocSpacing * p.sgf90).toFixed(3)}" = ${RafterMath.formatFeetInches(2 * p.ocSpacing * p.sgf90)}\n3rd Jack (3 in) = 3 × ${(p.ocSpacing * p.sgf90).toFixed(3)}" = ${RafterMath.formatFeetInches(3 * p.ocSpacing * p.sgf90)}`
            },
            // Q6
            {
                id: 6,
                title: `6. What would a jack be if it was Parameter A (${p.paramA}") from corner?`,
                type: "single",
                unitType: "length_inches_or_feet",
                targetInches: p.paramA * p.sgf90,
                formula: `Jack Line Length = Parameter A × 90° SGF`,
                explanation: `Parameter A = ${p.paramA}"\nJack Length = ${p.paramA}" × ${p.sgf90.toFixed(4)} = ${(p.paramA * p.sgf90).toFixed(3)}" (${RafterMath.formatFeetInches(p.paramA * p.sgf90)})`
            },
            // Q7
            {
                id: 7,
                title: "7. What is the Major Hips Line Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.majorSpanInches * p.sgf45,
                formula: `Major Hip Line Length = ½ × Major Span × 45° SGF`,
                explanation: `Half Major Span = ½ × ${RafterMath.formatFeetInches(p.majorSpanInches)} = ${(0.5 * p.majorSpanInches / 12).toFixed(3)} ft\nMajor Hip = ${(0.5 * p.majorSpanInches / 12).toFixed(3)} ft × ${p.sgf45.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.majorSpanInches * p.sgf45)} (${(0.5 * p.majorSpanInches * p.sgf45 / 12).toFixed(3)} ft)`
            },
            // Q8
            {
                id: 8,
                title: "8. What is the Supporting Valley Line Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.majorSpanInches * p.sgf45,
                formula: `Supporting Valley Line Length = ½ × Major Span × 45° SGF`,
                explanation: `Supporting Valley = ½ × ${RafterMath.formatFeetInches(p.majorSpanInches)} × ${p.sgf45.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.majorSpanInches * p.sgf45)} (${(0.5 * p.majorSpanInches * p.sgf45 / 12).toFixed(3)} ft)`
            },
            // Q9
            {
                id: 9,
                title: "9. What is the length of the Major Ridge?",
                type: "single",
                unitType: "length_feet",
                targetInches: p.buildingLengthInches - (0.5 * p.majorSpanInches),
                formula: `Major Ridge Length = Length of Building - (½ × Major Span)`,
                explanation: `Building Length = ${RafterMath.formatFeetInches(p.buildingLengthInches)}\nSubtract 1/2 Major Span = ${RafterMath.formatFeetInches(0.5 * p.majorSpanInches)}\nMajor Ridge = ${RafterMath.formatFeetInches(p.buildingLengthInches - 0.5 * p.majorSpanInches)} (${((p.buildingLengthInches - 0.5 * p.majorSpanInches)/12).toFixed(3)} ft)`
            },
            // Q10
            {
                id: 10,
                title: "10. What is the Minor Ridge Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: p.minorProjectionInches,
                formula: `Minor Ridge Length = Minor Wall Projection`,
                explanation: `Minor Wall Projection = ${RafterMath.formatFeetInches(p.minorProjectionInches)} (${(p.minorProjectionInches/12).toFixed(3)} ft)`
            },
            // Q11
            {
                id: 11,
                title: "11. What is the Minor Hip Line Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.minorSpanInches * p.sgf45,
                formula: `Minor Hip Line Length = ½ × Minor Span × 45° SGF`,
                explanation: `Half Minor Span = ½ × ${RafterMath.formatFeetInches(p.minorSpanInches)} = ${(0.5 * p.minorSpanInches / 12).toFixed(3)} ft\nMinor Hip = ${(0.5 * p.minorSpanInches / 12).toFixed(3)} ft × ${p.sgf45.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.minorSpanInches * p.sgf45)} (${(0.5 * p.minorSpanInches * p.sgf45 / 12).toFixed(3)} ft)`
            },
            // Q12
            {
                id: 12,
                title: "12. What is the Supported Valley Line Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.minorSpanInches * p.sgf45,
                formula: `Supported Valley Line Length = ½ × Minor Span × 45° SGF`,
                explanation: `Supported Valley = ½ × ${RafterMath.formatFeetInches(p.minorSpanInches)} × ${p.sgf45.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.minorSpanInches * p.sgf45)} (${(0.5 * p.minorSpanInches * p.sgf45 / 12).toFixed(3)} ft)`
            },
            // Q13
            {
                id: 13,
                title: `13. What is the Valley Cripple Line Length (Parameter B = ${p.paramB}")?`,
                type: "single",
                unitType: "length_inches_or_feet",
                targetInches: p.paramB * p.sgf90,
                formula: `Valley Cripple Line Length = Parameter B × 90° SGF`,
                explanation: `Parameter B = ${p.paramB}"\nValley Cripple = ${p.paramB}" × ${p.sgf90.toFixed(4)} = ${(p.paramB * p.sgf90).toFixed(3)}" (${RafterMath.formatFeetInches(p.paramB * p.sgf90)})`
            },
            // Q14
            {
                id: 14,
                title: `14. What is the Major Valley Jack Line Length (Parameter C = ${p.paramC}")?`,
                type: "single",
                unitType: "length_inches_or_feet",
                targetInches: p.paramC * p.sgf90,
                formula: `Major Valley Jack Line Length = Parameter C × 90° SGF`,
                explanation: `Parameter C = ${p.paramC}"\nMajor Valley Jack = ${p.paramC}" × ${p.sgf90.toFixed(4)} = ${(p.paramC * p.sgf90).toFixed(3)}" (${RafterMath.formatFeetInches(p.paramC * p.sgf90)})`
            },
            // Q15
            {
                id: 15,
                title: "15. What is the Hip Valley Cripple Line Length?",
                type: "single",
                unitType: "length_feet",
                targetInches: p.minorOffsetInches * p.sgf90,
                formula: `Hip Valley Cripple Line Length = Offset of Minor from Corner × 90° SGF`,
                explanation: `Offset = ${RafterMath.formatFeetInches(p.minorOffsetInches)} (${(p.minorOffsetInches/12).toFixed(3)} ft)\nHip Valley Cripple = ${(p.minorOffsetInches/12).toFixed(3)} ft × ${p.sgf90.toFixed(4)} = ${RafterMath.formatFeetInches(p.minorOffsetInches * p.sgf90)} (${(p.minorOffsetInches * p.sgf90 / 12).toFixed(3)} ft)`
            },
            // Q16
            {
                id: 16,
                title: `16. What is the Minor Valley Jack Line Length (Parameter D = ${p.paramD}")?`,
                type: "single",
                unitType: "length_inches_or_feet",
                targetInches: p.paramD * p.sgf90,
                formula: `Minor Valley Jack Line Length = Parameter D × 90° SGF`,
                explanation: `Parameter D = ${p.paramD}"\nMinor Valley Jack = ${p.paramD}" × ${p.sgf90.toFixed(4)} = ${(p.paramD * p.sgf90).toFixed(3)}" (${RafterMath.formatFeetInches(p.paramD * p.sgf90)})`
            },
            // Q17
            {
                id: 17,
                title: "17. What is the Pin Rafter Line Length on Minor roof?",
                type: "single",
                unitType: "length_feet",
                targetInches: 0.5 * p.minorSpanInches * p.sgf90,
                formula: `Pin Rafter Minor Roof = ½ × Minor Span × 90° SGF`,
                explanation: `Half Minor Span = ½ × ${RafterMath.formatFeetInches(p.minorSpanInches)} = ${(0.5 * p.minorSpanInches / 12).toFixed(3)} ft\nPin Rafter = ${(0.5 * p.minorSpanInches / 12).toFixed(3)} ft × ${p.sgf90.toFixed(4)} = ${RafterMath.formatFeetInches(0.5 * p.minorSpanInches * p.sgf90)} (${(0.5 * p.minorSpanInches * p.sgf90 / 12).toFixed(3)} ft)`
            }
        ];
    },

    // Render ALL 17 Questions at once
    renderAllQuestionsUI() {
        const questionsContainer = document.getElementById('questions-list-container');
        if (!questionsContainer) return;

        questionsContainer.innerHTML = '';
        this.questionStates = {};

        this.questionsList.forEach((q) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.id = `q-card-${q.id}`;

            let inputHtml = '';
            if (q.type === 'single') {
                const placeholderText = q.unitType === 'factor' ? "e.g. 1.118 or 1.1180" : "e.g. 24' 6\", 24.5, or 294\"";
                const labelText = q.unitType === 'factor' ? "Answer (Decimal Factor):" : "Answer:";
                inputHtml = `
                    <div class="input-group">
                        <label for="input-q-${q.id}" class="input-label">${labelText}</label>
                        <input type="text" id="input-q-${q.id}" class="answer-field" placeholder="${placeholderText}" autocomplete="off" />
                    </div>
                `;
            } else if (q.type === 'triple') {
                inputHtml = `
                    <div class="triple-input-grid">
                        <div class="input-group">
                            <label for="input-q-${q.id}-1" class="input-label">1st Rafter (1 in):</label>
                            <input type="text" id="input-q-${q.id}-1" class="answer-field" placeholder="e.g. 1' 6&quot; or 18&quot;" autocomplete="off" />
                        </div>
                        <div class="input-group">
                            <label for="input-q-${q.id}-2" class="input-label">2nd Rafter (2 in):</label>
                            <input type="text" id="input-q-${q.id}-2" class="answer-field" placeholder="e.g. 3' 0&quot; or 36&quot;" autocomplete="off" />
                        </div>
                        <div class="input-group">
                            <label for="input-q-${q.id}-3" class="input-label">3rd Rafter (3 in):</label>
                            <input type="text" id="input-q-${q.id}-3" class="answer-field" placeholder="e.g. 4' 6&quot; or 54&quot;" autocomplete="off" />
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="question-header">
                    <span class="q-badge">Q${q.id}</span>
                    <h3 class="q-title">${q.title}</h3>
                </div>
                <div class="question-body">
                    ${inputHtml}
                    <button type="button" class="btn btn-secondary btn-sm" onclick="RafterApp.checkQuestion(${q.id})">
                        Check Q${q.id}
                    </button>
                    <div id="feedback-q-${q.id}" class="feedback-box hidden"></div>
                </div>
            `;

            questionsContainer.appendChild(card);
        });

        const scoreBanner = document.getElementById('score-summary-banner');
        if (scoreBanner) {
            scoreBanner.className = 'score-summary-box hidden';
        }
    },

    // Check an individual question by ID
    checkQuestion(qId) {
        const q = this.questionsList.find(item => item.id === qId);
        if (!q) return false;

        const feedbackBox = document.getElementById(`feedback-q-${qId}`);
        let isCorrect = false;

        if (q.type === 'single') {
            const rawVal = document.getElementById(`input-q-${qId}`)?.value || '';
            const parsedInches = RafterMath.parseInputToInches(rawVal);

            if (q.unitType === 'factor') {
                const targetVal = q.targetValue;
                const userVal = parseFloat(rawVal);
                if (!isNaN(userVal) && Math.abs(userVal - targetVal) < 0.006) {
                    isCorrect = true;
                }
            } else {
                const targetInches = q.targetInches;
                if (parsedInches !== null) {
                    const diffInches = Math.abs(parsedInches - targetInches);
                    const diffAsFeet = Math.abs((parsedInches * 12) - targetInches);
                    if (diffInches <= 0.75 || diffAsFeet <= 0.75) {
                        isCorrect = true;
                    }
                }
            }
        } else if (q.type === 'triple') {
            const val1 = RafterMath.parseInputToInches(document.getElementById(`input-q-${qId}-1`)?.value);
            const val2 = RafterMath.parseInputToInches(document.getElementById(`input-q-${qId}-2`)?.value);
            const val3 = RafterMath.parseInputToInches(document.getElementById(`input-q-${qId}-3`)?.value);

            const match1 = val1 !== null && (Math.abs(val1 - q.targetInches1) <= 0.75 || Math.abs((val1 * 12) - q.targetInches1) <= 0.75);
            const match2 = val2 !== null && (Math.abs(val2 - q.targetInches2) <= 0.75 || Math.abs((val2 * 12) - q.targetInches2) <= 0.75);
            const match3 = val3 !== null && (Math.abs(val3 - q.targetInches3) <= 0.75 || Math.abs((val3 * 12) - q.targetInches3) <= 0.75);

            if (match1 && match2 && match3) {
                isCorrect = true;
            }
        }

        this.questionStates[qId] = isCorrect;

        if (isCorrect) {
            feedbackBox.className = 'feedback-box feedback-correct';
            feedbackBox.innerHTML = `
                <div class="feedback-title">✓ Correct!</div>
                <div class="feedback-body">Great job! Your answer matches the framing formula.</div>
            `;
        } else {
            feedbackBox.className = 'feedback-box feedback-incorrect';
            
            let answerSummary = '';
            if (q.type === 'single') {
                if (q.unitType === 'factor') {
                    answerSummary = `<strong>Correct Answer:</strong> ${q.targetValue.toFixed(4)}`;
                } else {
                    answerSummary = `<strong>Correct Answer:</strong> ${RafterMath.formatFeetInches(q.targetInches)} (${RafterMath.formatDecimalFeet(q.targetInches)} or ${RafterMath.formatDecimalInches(q.targetInches)})`;
                }
            } else if (q.type === 'triple') {
                answerSummary = `
                    <strong>Correct Answers:</strong><br>
                    • 1st Rafter: ${RafterMath.formatFeetInches(q.targetInches1)} (${(q.targetInches1/12).toFixed(3)} ft)<br>
                    • 2nd Rafter: ${RafterMath.formatFeetInches(q.targetInches2)} (${(q.targetInches2/12).toFixed(3)} ft)<br>
                    • 3rd Rafter: ${RafterMath.formatFeetInches(q.targetInches3)} (${(q.targetInches3/12).toFixed(3)} ft)
                `;
            }

            feedbackBox.innerHTML = `
                <div class="feedback-title">✗ Incorrect</div>
                <div class="feedback-body">
                    <p>${answerSummary}</p>
                    <div class="formula-note">
                        <div class="formula-header">📐 Framing Formula & Solution Steps:</div>
                        <div class="formula-code">${q.formula}</div>
                        <div class="formula-explanation">${q.explanation.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `;
        }

        return isCorrect;
    },

    // Check all 17 answers at once
    checkAllAnswers() {
        let numCorrect = 0;
        const total = this.questionsList.length;

        this.questionsList.forEach((q) => {
            const result = this.checkQuestion(q.id);
            if (result) numCorrect++;
        });

        const pct = Math.round((numCorrect / total) * 100);
        const scoreBanner = document.getElementById('score-summary-banner');
        if (scoreBanner) {
            scoreBanner.className = `score-summary-box ${numCorrect === total ? 'score-perfect' : 'score-normal'}`;
            scoreBanner.innerHTML = `
                <div class="score-title">Worksheet Result: ${numCorrect} / ${total} Correct (${pct}%)</div>
                <div class="score-subtitle">${numCorrect === total ? '🎉 Perfect Score! Outstanding carpentry framing calculations!' : 'Review the step-by-step formula solutions for any incorrect questions above.'}</div>
            `;
            scoreBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    },

    init() {
        this.generateParameters();

        const genBtn = document.getElementById('btn-generate-scenario');
        if (genBtn) {
            genBtn.addEventListener('click', () => {
                this.generateParameters();
            });
        }

        const checkAllBtn = document.getElementById('btn-check-all');
        if (checkAllBtn) {
            checkAllBtn.addEventListener('click', () => {
                this.checkAllAnswers();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList.contains('answer-field')) {
                const qIdMatch = e.target.id.match(/input-q-(\d+)/);
                if (qIdMatch) {
                    this.checkQuestion(parseInt(qIdMatch[1], 10));
                }
            }
        });
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    RafterApp.init();
});
