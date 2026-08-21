/**
 * Tests for pure utility functions in app/store/chat.ts
 * Covers: createMessage, countUserMessages, countUserTokens,
 * buildConversationTranscript, buildUserMessagesText,
 * buildTopicPrompt, buildTopicRequestMessages, fillTemplateWith
 */

import {
  createMessage,
  countUserMessages,
  countUserTokens,
  buildConversationTranscript,
  buildUserMessagesText,
  buildTopicPrompt,
  buildTopicRequestMessages,
  fillTemplateWith,
  type ChatMessage,
} from './chat';
import { DEFAULT_MODELS, KnowledgeCutOffDate } from '../constant';

describe('createMessage', () => {
  it('creates a message with default user role and empty content', () => {
    const msg = createMessage({});
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('');
    expect(msg.id).toBeDefined();
    expect(msg.date).toBeDefined();
  });

  it('merges override properties', () => {
    const msg = createMessage({ role: 'assistant', content: 'Hello' });
    expect(msg.role).toBe('assistant');
    expect(msg.content).toBe('Hello');
    expect(msg.id).toBeDefined();
  });

  it('generates unique ids', () => {
    const a = createMessage({});
    const b = createMessage({});
    expect(a.id).not.toBe(b.id);
  });
});

describe('countUserMessages', () => {
  it('counts user messages with content', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Hi' }),
      createMessage({ role: 'user', content: 'How are you?' }),
    ];
    expect(countUserMessages(messages)).toBe(2);
  });

  it('excludes error messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello', isError: true }),
      createMessage({ role: 'user', content: 'Valid' }),
    ];
    expect(countUserMessages(messages)).toBe(1);
  });

  it('excludes empty content', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: '' }),
      createMessage({ role: 'user', content: '   ' }),
      createMessage({ role: 'user', content: 'Hello' }),
    ];
    expect(countUserMessages(messages)).toBe(1);
  });

  it('returns 0 for empty array', () => {
    expect(countUserMessages([])).toBe(0);
  });

  it('returns 0 for assistant-only messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'assistant', content: 'Hello' }),
      createMessage({ role: 'system', content: 'System' }),
    ];
    expect(countUserMessages(messages)).toBe(0);
  });
});

describe('countUserTokens', () => {
  it('counts tokens for user messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello world' }),
    ];
    const tokens = countUserTokens(messages);
    expect(tokens).toBeGreaterThan(0);
  });

  it('excludes non-user messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'assistant', content: 'Hello world this is long' }),
    ];
    expect(countUserTokens(messages)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(countUserTokens([])).toBe(0);
  });
});

describe('buildConversationTranscript', () => {
  it('builds transcript with role prefix', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Hi there' }),
    ];
    const transcript = buildConversationTranscript(messages, false);
    expect(transcript).toBe('user: Hello\nassistant: Hi there');
  });

  it('includes system messages when includeSystem is true', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'system', content: 'System prompt' }),
      createMessage({ role: 'user', content: 'Hello' }),
    ];
    const transcript = buildConversationTranscript(messages, true);
    expect(transcript).toContain('system: System prompt');
  });

  it('excludes system messages when includeSystem is false', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'system', content: 'System prompt' }),
      createMessage({ role: 'user', content: 'Hello' }),
    ];
    const transcript = buildConversationTranscript(messages, false);
    expect(transcript).not.toContain('system');
  });

  it('filters out empty content messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: '' }),
      createMessage({ role: 'user', content: 'Hello' }),
    ];
    const transcript = buildConversationTranscript(messages, false);
    expect(transcript).toBe('user: Hello');
  });

  it('returns empty string for empty array', () => {
    expect(buildConversationTranscript([], false)).toBe('');
  });
});

describe('buildUserMessagesText', () => {
  it('joins user message contents with newlines', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'First' }),
      createMessage({ role: 'assistant', content: 'Response' }),
      createMessage({ role: 'user', content: 'Second' }),
    ];
    expect(buildUserMessagesText(messages)).toBe('First\nSecond');
  });

  it('excludes error messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello', isError: true }),
      createMessage({ role: 'user', content: 'Valid' }),
    ];
    expect(buildUserMessagesText(messages)).toBe('Valid');
  });

  it('returns empty string for no user messages', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'assistant', content: 'Hello' }),
    ];
    expect(buildUserMessagesText(messages)).toBe('');
  });
});

describe('buildTopicPrompt', () => {
  it('replaces {{user_messages}} placeholder', () => {
    const result = buildTopicPrompt(
      'Summarize: {{user_messages}}',
      'Hello world',
      '',
    );
    expect(result).toBe('Summarize: Hello world');
  });

  it('replaces {{assistant_message}} placeholder', () => {
    const result = buildTopicPrompt(
      'Context: {{assistant_message}}',
      '',
      'Hi there',
    );
    expect(result).toBe('Context: Hi there');
  });

  it('replaces both placeholders', () => {
    const result = buildTopicPrompt(
      '{{user_messages}} -> {{assistant_message}}',
      'User said',
      'Assistant replied',
    );
    expect(result).toBe('User said -> Assistant replied');
  });

  it('appends user messages when no placeholder', () => {
    const result = buildTopicPrompt('Summarize this:', 'Hello world', '');
    expect(result).toBe('Summarize this:\n\n用户发言：\nHello world');
  });

  it('appends assistant message when no placeholder', () => {
    const result = buildTopicPrompt('Context:', '', 'Hi there');
    expect(result).toBe('Context:\n\n助手回复：\nHi there');
  });

  it('returns instruction unchanged when no values', () => {
    const result = buildTopicPrompt('Just an instruction', '', '');
    expect(result).toBe('Just an instruction');
  });
});

describe('buildTopicRequestMessages', () => {
  it('creates a single user message with topic prompt', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'Hello' }),
      createMessage({ role: 'assistant', content: 'Hi' }),
    ];
    const result = buildTopicRequestMessages('Summarize: {{user_messages}}', messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
    expect(result[0].content).toContain('Hello');
    // buildTopicRequestMessages only includes user messages in the prompt
    expect(result[0].content).not.toContain('Hi');
  });

  it('includes user messages in the prompt', () => {
    const messages: ChatMessage[] = [
      createMessage({ role: 'user', content: 'First message' }),
    ];
    const result = buildTopicRequestMessages('Topic: {{user_messages}}', messages);
    expect(result[0].content).toContain('First message');
  });
});

describe('fillTemplateWith', () => {
  const modelConfig = {
    model: 'gpt-4o',
    providerName: 'OpenAI',
    temperature: 0.7,
    template: 'You are {{model}} by {{ServiceProvider}}. Cutoff: {{cutoff}}. Input: {{input}}',
  } as any;

  it('replaces {{model}} placeholder in template', () => {
    const result = fillTemplateWith('Hello world', modelConfig);
    expect(result).toContain('gpt-4o');
  });

  it('replaces {{ServiceProvider}} placeholder in template', () => {
    const result = fillTemplateWith('Hello world', modelConfig);
    expect(result).toContain('OpenAI');
  });

  it('replaces {{cutoff}} placeholder with cutoff date', () => {
    const result = fillTemplateWith('Hello world', modelConfig);
    expect(result).toContain('2023-09');
  });

  it('inserts input via {{input}} placeholder', () => {
    const result = fillTemplateWith('Hello world', modelConfig);
    expect(result).toContain('Hello world');
  });

  it('handles unknown model with default cutoff', () => {
    const config = {
      model: 'unknown-model',
      providerName: 'Unknown',
      template: 'Cutoff: {{cutoff}}. Input: {{input}}',
    } as any;
    const result = fillTemplateWith('test input', config);
    expect(result).toContain('2021-09');
    expect(result).toContain('test input');
  });

  it('uses DEFAULT_INPUT_TEMPLATE when no template in config', () => {
    const config = {
      model: 'gpt-4o',
      providerName: 'OpenAI',
    } as any;
    const result = fillTemplateWith('test input', config);
    expect(result).toContain('test input');
  });
});