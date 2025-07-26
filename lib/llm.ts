// LLM service abstraction layer
// This allows switching between different LLM providers (OpenAI, Anthropic, Google Gemini)

export interface LLMProvider {
    name: string;
    parseSllabus(text: string): Promise<ParsedSyllabus>;
    composeDashboard(data: ParsedSyllabus, components: ComponentManifest): Promise<DashboardLayout>;
}

export interface ParsedSyllabus {
    courseName: string;
    instructor: string;
    assignments: Assignment[];
    exams: Exam[];
    gradingPolicy: GradingPolicy;
    importantDates: ImportantDate[];
}

export interface Assignment {
    name: string;
    dueDate: string;
    weight: number;
    description?: string;
}

export interface Exam {
    name: string;
    date: string;
    weight: number;
    coverage?: string;
}

export interface GradingPolicy {
    scale: string;
    breakdown: { [key: string]: number };
}

export interface ImportantDate {
    date: string;
    event: string;
    description?: string;
}

export interface ComponentManifest {
    availableComponents: string[];
    layouts: string[];
}

export interface DashboardLayout {
    components: DashboardComponent[];
    layout: string;
}

export interface DashboardComponent {
    type: string;
    props: Record<string, unknown>;
    position: { x: number; y: number; width: number; height: number };
}

class OpenAIProvider implements LLMProvider {
    name = 'OpenAI';

    async parseSllabus(_text: string): Promise<ParsedSyllabus> {
        // TODO: Implement OpenAI API call for parsing
        throw new Error('Not implemented');
    }

    async composeDashboard(_data: ParsedSyllabus, _components: ComponentManifest): Promise<DashboardLayout> {
        // TODO: Implement OpenAI API call for dashboard composition
        throw new Error('Not implemented');
    }
}

class AnthropicProvider implements LLMProvider {
    name = 'Anthropic';

    async parseSllabus(_text: string): Promise<ParsedSyllabus> {
        // TODO: Implement Anthropic API call for parsing
        throw new Error('Not implemented');
    }

    async composeDashboard(_data: ParsedSyllabus, _components: ComponentManifest): Promise<DashboardLayout> {
        // TODO: Implement Anthropic API call for dashboard composition
        throw new Error('Not implemented');
    }
}

// Factory function to get the configured LLM provider
export function getLLMProvider(): LLMProvider {
    const provider = process.env.LLM_PROVIDER || 'openai';

    switch (provider.toLowerCase()) {
        case 'openai':
            return new OpenAIProvider();
        case 'anthropic':
            return new AnthropicProvider();
        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}
