import { describe, it, expect, afterEach } from 'vitest';
import { buildN8nWorkflowUrl } from './workflow-url';

describe('buildN8nWorkflowUrl', () => {
  const original = process.env.N8N_BASE_URL;
  afterEach(() => {
    process.env.N8N_BASE_URL = original;
  });

  it('returns null without a workflow id', () => {
    process.env.N8N_BASE_URL = 'https://n8n.example.com';
    expect(buildN8nWorkflowUrl(null)).toBeNull();
  });

  it('returns null when N8N_BASE_URL is unset', () => {
    delete process.env.N8N_BASE_URL;
    expect(buildN8nWorkflowUrl('abc123')).toBeNull();
  });

  it('builds /workflow/<id> on the configured base', () => {
    process.env.N8N_BASE_URL = 'https://n8n.example.com';
    expect(buildN8nWorkflowUrl('abc123')).toBe(
      'https://n8n.example.com/workflow/abc123',
    );
  });

  it('strips a trailing slash from the base', () => {
    process.env.N8N_BASE_URL = 'https://n8n.example.com/';
    expect(buildN8nWorkflowUrl('abc123')).toBe(
      'https://n8n.example.com/workflow/abc123',
    );
  });

  it('URL-encodes the workflow id', () => {
    process.env.N8N_BASE_URL = 'https://n8n.example.com';
    expect(buildN8nWorkflowUrl('wf with space')).toBe(
      'https://n8n.example.com/workflow/wf%20with%20space',
    );
  });
});
