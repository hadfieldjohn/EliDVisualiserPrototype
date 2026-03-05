// Mock reactflow — uses browser APIs not available in Jest/jsdom
jest.mock('reactflow', () => ({
    __esModule: true,
    default: () => null,
    MarkerType: {ArrowClosed: 'arrowclosed'},
    Position: {Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right'},
    MiniMap: () => null,
    Controls: () => null,
    getRectOfNodes: jest.fn(),
    getTransformForBounds: jest.fn(),
}));

// Mock MarkDownNode to prevent react-markdown (ESM-only) from being loaded by Jest
jest.mock('./MarkDownNode', () => ({__esModule: true, default: () => null}));

import {sortByKey, buildNodeLabel, buildRoutingLabel, parseConfigRules} from './App';

// Suppress the debug console.log inside buildNodeLabel
let consoleSpy;
beforeAll(() => { consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { consoleSpy.mockRestore(); });

// ---------------------------------------------------------------------------
// sortByKey
// ---------------------------------------------------------------------------

describe('sortByKey', () => {
    test('sorts by string key ascending', () => {
        const arr = [{n: 'C'}, {n: 'A'}, {n: 'B'}];
        expect(sortByKey(arr, 'n')).toEqual([{n: 'A'}, {n: 'B'}, {n: 'C'}]);
    });

    test('sorts by numeric key ascending', () => {
        const arr = [{p: 3}, {p: 1}, {p: 2}];
        expect(sortByKey(arr, 'p')).toEqual([{p: 1}, {p: 2}, {p: 3}]);
    });

    test('returns empty array unchanged', () => {
        expect(sortByKey([], 'key')).toEqual([]);
    });

    test('handles already-sorted input', () => {
        const arr = [{p: 1}, {p: 2}, {p: 3}];
        expect(sortByKey(arr, 'p')).toEqual([{p: 1}, {p: 2}, {p: 3}]);
    });
});

// ---------------------------------------------------------------------------
// buildNodeLabel
// ---------------------------------------------------------------------------

const BASE_RULE = {
    Name: 'AgeFilter',
    Description: 'Checks the age of the person',
    Priority: 1,
    Type: 'F',
};

const NO_LAST = {Priority: null};

describe('buildNodeLabel', () => {
    test('returns name with separator when all flags are false', () => {
        expect(buildNodeLabel(BASE_RULE, false, false, false, 0, NO_LAST, false))
            .toBe('AgeFilter\\');
    });

    test('showDescription appends description after name', () => {
        expect(buildNodeLabel(BASE_RULE, false, false, true, 0, NO_LAST, false))
            .toBe('AgeFilter\\Checks the age of the person\\');
    });

    test('showDescription with andRule omits the name', () => {
        const result = buildNodeLabel(BASE_RULE, false, false, true, 1, {Priority: 1}, true);
        expect(result.startsWith('\\')).toBe(true);
        expect(result).toContain('Checks the age of the person');
    });

    test('showPriority prepends priority at the first rule', () => {
        expect(buildNodeLabel(BASE_RULE, false, true, false, 0, NO_LAST, false))
            .toBe('(1) AgeFilter\\');
    });

    test('showPriority prepends when priority changes between rules', () => {
        expect(buildNodeLabel(BASE_RULE, false, true, false, 1, {Priority: 2}, false))
            .toBe('(1) AgeFilter\\');
    });

    test('showPriority does not prepend when priority is unchanged', () => {
        expect(buildNodeLabel(BASE_RULE, false, true, false, 1, {Priority: 1}, false))
            .toBe('AgeFilter\\');
    });

    test('showDetail adds PERSON attribute detail', () => {
        const rule = {...BASE_RULE, AttributeLevel: 'PERSON', AttributeName: 'Age', Operator: '>=', Comparator: '18'};
        expect(buildNodeLabel(rule, true, false, false, 0, NO_LAST, false))
            .toContain('Age >= 18');
    });

    test('showDetail adds TARGET attribute detail', () => {
        const rule = {...BASE_RULE, AttributeLevel: 'TARGET', AttributeTarget: 'Email', AttributeName: 'Optout', Operator: '=', Comparator: 'N'};
        expect(buildNodeLabel(rule, true, false, false, 0, NO_LAST, false))
            .toContain('Email Optout = N');
    });

    test('showDetail adds COHORT detail', () => {
        const rule = {...BASE_RULE, AttributeLevel: 'COHORT', Operator: 'IN', Comparator: 'CohortA'};
        expect(buildNodeLabel(rule, true, false, false, 0, NO_LAST, false))
            .toContain('IN CohortA');
    });

    test('truncates Comparator longer than 29 characters with ellipsis', () => {
        const rule = {...BASE_RULE, AttributeLevel: 'PERSON', AttributeName: 'X', Operator: '=', Comparator: 'A'.repeat(40)};
        const result = buildNodeLabel(rule, true, false, false, 0, NO_LAST, false);
        expect(result).toContain('A'.repeat(30) + '...');
    });

    test('does not truncate Comparator of 29 characters or fewer', () => {
        const rule = {...BASE_RULE, AttributeLevel: 'PERSON', AttributeName: 'X', Operator: '=', Comparator: 'A'.repeat(29)};
        expect(buildNodeLabel(rule, true, false, false, 0, NO_LAST, false))
            .not.toContain('...');
    });

    test('truncates Description longer than 100 characters', () => {
        const rule = {...BASE_RULE, Description: 'D'.repeat(120)};
        expect(buildNodeLabel(rule, false, false, true, 0, NO_LAST, false))
            .toContain('D'.repeat(100) + '...');
    });

    test('does not truncate Description of 100 characters or fewer', () => {
        const rule = {...BASE_RULE, Description: 'D'.repeat(100)};
        expect(buildNodeLabel(rule, false, false, true, 0, NO_LAST, false))
            .not.toContain('...');
    });

    test('truncates CohortLabel list to 4 items with "(and more)"', () => {
        const rule = {...BASE_RULE, CohortLabel: 'A,B,C,D,E'};
        expect(buildNodeLabel(rule, true, false, false, 0, NO_LAST, false))
            .toContain('(and more)');
    });

    test('shows all CohortLabel items when 4 or fewer', () => {
        const rule = {...BASE_RULE, CohortLabel: 'A,B,C,D'};
        const result = buildNodeLabel(rule, true, false, false, 0, NO_LAST, false);
        expect(result).not.toContain('(and more)');
        expect(result).toContain('A\nB\nC\nD');
    });
});

// ---------------------------------------------------------------------------
// buildRoutingLabel
// ---------------------------------------------------------------------------

describe('buildRoutingLabel', () => {
    test('returns empty string for null', () => {
        expect(buildRoutingLabel(null, {}, false)).toBe('');
    });

    test('returns empty string for undefined', () => {
        expect(buildRoutingLabel(undefined, {}, false)).toBe('');
    });

    test('returns empty string for empty string', () => {
        expect(buildRoutingLabel('', {}, false)).toBe('');
    });

    test('single plan with no routing map produces name~| format', () => {
        expect(buildRoutingLabel('PlanA', null, false)).toBe('PlanA~|');
    });

    test('ignores routing map when showDetail is false', () => {
        const map = {PlanA: {ExternalRoutingCode: 'CODE', ActionType: 'SMS', ActionDescription: 'Send SMS'}};
        expect(buildRoutingLabel('PlanA', map, false)).toBe('PlanA~|');
    });

    test('includes routing map details when showDetail is true', () => {
        const map = {PlanA: {ExternalRoutingCode: 'CODE', ActionType: 'SMS', ActionDescription: 'Send SMS'}};
        expect(buildRoutingLabel('PlanA', map, true)).toBe('PlanA (CODE/SMS)~Send SMS|');
    });

    test('plan not in routing map falls back to name~| format', () => {
        const map = {PlanB: {ExternalRoutingCode: 'CODE', ActionType: 'SMS', ActionDescription: 'Send SMS'}};
        expect(buildRoutingLabel('PlanA', map, true)).toBe('PlanA~|');
    });

    test('handles multiple plans', () => {
        expect(buildRoutingLabel('PlanA|PlanB', null, false)).toBe('PlanA~|PlanB~|');
    });

    test('handles trailing pipe in input without duplicating entries', () => {
        expect(buildRoutingLabel('PlanA|', null, false)).toBe('PlanA~|');
    });
});

// ---------------------------------------------------------------------------
// parseConfigRules
// ---------------------------------------------------------------------------

const makeRule = (overrides = {}) => ({
    Name: 'TestRule',
    Description: 'A test rule',
    Priority: 1,
    Type: 'F',
    ...overrides,
});

const makeMockConfig = (rules = [], cohorts = [], iterationOverrides = {}) => ({
    CampaignConfig: {
        DefaultCommsRouting: 'DefaultPlan',
        Iterations: [{
            ID: 'IT001',
            Name: 'Iteration One',
            IterationDate: '2024-01-01',
            IterationRules: rules,
            IterationCohorts: cohorts,
            DefaultCommsRouting: 'DefaultPlan',
            DefaultNotEligibleRouting: '',
            DefaultNotActionableRouting: '',
            ActionsMapper: {},
            ...iterationOverrides,
        }],
    },
});

const SELECTED = {value: 'IT001'};
const UNSELECTED = {value: '0'};

describe('parseConfigRules', () => {
    describe('with no CampaignConfig', () => {
        test('returns exactly the three terminal nodes', () => {
            const result = parseConfigRules({}, '', false, false, false);
            expect(result.nodes).toHaveLength(3);
            expect(result.nodes.map(n => n.id)).toEqual(expect.arrayContaining(['Suppressed', 'Filtered', 'Action']));
        });

        test('returns the placeholder iteration list', () => {
            const result = parseConfigRules({}, '', false, false, false);
            expect(result.iterations).toEqual([{value: '0', label: 'Please select file'}]);
        });
    });

    describe('iterations', () => {
        test('returns iteration list built from config', () => {
            const result = parseConfigRules(makeMockConfig(), UNSELECTED, false, false, false);
            expect(result.iterations).toHaveLength(1);
            expect(result.iterations[0]).toEqual({value: 'IT001', label: 'Iteration One (2024-01-01)'});
        });
    });

    describe('Filter (F) rules', () => {
        test('single F-type rule creates a leftdecision node', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'F'})]), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').type).toBe('leftdecision');
        });

        test('single F-type rule creates a Y edge to Filtered', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'F'})]), SELECTED, false, false, false);
            const edge = result.edges.find(e => e.target === 'Filtered' && e.label === 'Y');
            expect(edge).toBeDefined();
        });

        test('two F-type rules with the same priority: second node is a decision (AND) node', () => {
            const rules = [makeRule({Type: 'F', Priority: 1}), makeRule({Type: 'F', Name: 'Rule2', Priority: 1})];
            const result = parseConfigRules(makeMockConfig(rules), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').type).toBe('leftdecision');
            expect(result.nodes.find(n => n.id === '2').type).toBe('decision');
        });

        test('two F-type rules with different priorities are both leftdecision nodes', () => {
            const rules = [makeRule({Type: 'F', Priority: 1}), makeRule({Type: 'F', Name: 'Rule2', Priority: 2})];
            const result = parseConfigRules(makeMockConfig(rules), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').type).toBe('leftdecision');
            expect(result.nodes.find(n => n.id === '2').type).toBe('leftdecision');
        });
    });

    describe('Suppression (S) rules', () => {
        test('single S-type rule creates a leftdecision node', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'S'})]), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').type).toBe('leftdecision');
        });

        test('single S-type rule creates a Y edge to Suppressed', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'S'})]), SELECTED, false, false, false);
            const edge = result.edges.find(e => e.target === 'Suppressed' && e.label === 'Y');
            expect(edge).toBeDefined();
        });

        test('S-type rule with RuleStop=Y gets the stop icon', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'S', RuleStop: 'Y'})]), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').data.icon).toBeTruthy();
        });

        test('S-type rule with RuleStop=N has an empty icon', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'S', RuleStop: 'N'})]), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').data.icon).toBe('');
        });

        test('F-type rule with RuleStop=Y does not get the stop icon', () => {
            const result = parseConfigRules(makeMockConfig([makeRule({Type: 'F', RuleStop: 'Y'})]), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === '1').data.icon).toBe('');
        });
    });

    describe('cohort input nodes', () => {
        test('cohort creates an inputnode with the correct label', () => {
            const config = makeMockConfig([], [{CohortLabel: 'My Cohort', Priority: 1, Virtual: 'N'}]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            const node = result.nodes.find(n => n.id === 'CH_1');
            expect(node).toBeDefined();
            expect(node.type).toBe('inputnode');
            expect(node.data.label).toBe('My Cohort');
        });

        test('virtual cohort (Virtual=Y) has a non-empty icon', () => {
            const config = makeMockConfig([], [{CohortLabel: 'Virtual', Priority: 1, Virtual: 'Y'}]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === 'CH_1').data.icon).toBeTruthy();
        });

        test('virtual cohort (Virtual=y) also has a non-empty icon', () => {
            const config = makeMockConfig([], [{CohortLabel: 'Virtual', Priority: 1, Virtual: 'y'}]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === 'CH_1').data.icon).toBeTruthy();
        });

        test('non-virtual cohort has an empty icon', () => {
            const config = makeMockConfig([], [{CohortLabel: 'Normal', Priority: 1, Virtual: 'N'}]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === 'CH_1').data.icon).toBe('');
        });

        test('multiple cohorts create multiple inputnodes', () => {
            const cohorts = [
                {CohortLabel: 'CohortA', Priority: 1, Virtual: 'N'},
                {CohortLabel: 'CohortB', Priority: 2, Virtual: 'N'},
            ];
            const result = parseConfigRules(makeMockConfig([], cohorts), SELECTED, false, false, false);
            expect(result.nodes.find(n => n.id === 'CH_1')).toBeDefined();
            expect(result.nodes.find(n => n.id === 'CH_2')).toBeDefined();
        });
    });

    describe('Routing (R) rules', () => {
        test('R-type rule creates a topdecision node', () => {
            const config = makeMockConfig([makeRule({Type: 'R', Name: 'Route', CommsRouting: 'PlanA'})]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            const node = result.nodes.find(n => n.id === 'RP_R_1');
            expect(node).toBeDefined();
            expect(node.type).toBe('topdecision');
        });

        test('R-type rule creates an edge from Action to the routing node', () => {
            const config = makeMockConfig([makeRule({Type: 'R', Name: 'Route', CommsRouting: 'PlanA'})]);
            const result = parseConfigRules(config, SELECTED, false, false, false);
            expect(result.edges.find(e => e.source === 'Action' && e.target === 'RP_R_1')).toBeDefined();
        });
    });
});
