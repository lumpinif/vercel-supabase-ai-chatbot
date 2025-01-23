// Define your models here.

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
}

export const models: Array<Model> = [
  {
    id: 'gpt-4o-mini',
    label: 'GPT 4o mini',
    apiIdentifier: 'gpt-4o-mini',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'gpt-4o',
    label: 'GPT 4o',
    apiIdentifier: 'gpt-4o',
    description: 'For complex, multi-step tasks',
  },
  {
    id: 'deepseek-chat',
    label: 'DeepSeek-V3',
    apiIdentifier: 'deepseek-chat',
    description: 'DeepSeek-V3 from DeepSeek',
  },
  {
    id: 'deepseek-reasoner',
    label: 'DeepSeek-R1',
    apiIdentifier: 'deepseek-reasoner',
    description: 'DeepSeek-R1 from DeepSeek',
  },
] as const;

export const DEFAULT_MODEL_NAME: string = 'gpt-4o-mini';
