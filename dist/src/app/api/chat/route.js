"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const client_1 = require("@/lib/mcp/client");
const workflow_types_1 = require("@/lib/chat/workflow-types");
const workflowContext = {
    workflows: new Map(),
};
function getWorkflow(conversationId) {
    return workflowContext.workflows.get(conversationId) || null;
}
function setWorkflow(conversationId, state) {
    workflowContext.workflows.set(conversationId, state);
}
function clearWorkflow(conversationId) {
    workflowContext.workflows.delete(conversationId);
}
function isWorkflowCommand(content) {
    const lower = content.toLowerCase().trim();
    if (lower === 'yes' || lower === 'confirm' || lower === 'y') {
        return { command: 'confirm' };
    }
    if (lower === 'no' || lower === 'cancel' || lower === 'n') {
        return { command: 'cancel' };
    }
    if (lower === 'back' || lower === 'go back') {
        return { command: 'back' };
    }
    if (lower === 'skip') {
        return { command: 'skip' };
    }
    return null;
}
function extractEntityTypeFromContent(content) {
    const lower = content.toLowerCase();
    if (lower.includes('project'))
        return 'project';
    if (lower.includes('task'))
        return 'task';
    if (lower.includes('team'))
        return 'team';
    if (lower.includes('department'))
        return 'department';
    if (lower.includes('organization'))
        return 'organization';
    if (lower.includes('member'))
        return 'member';
    if (lower.includes('invite'))
        return 'invitation';
    return null;
}
function extractActionFromContent(content) {
    const lower = content.toLowerCase();
    if (lower.includes('create') ||
        lower.includes('new') ||
        lower.includes('add')) {
        return 'create';
    }
    if (lower.includes('update') ||
        lower.includes('edit') ||
        lower.includes('modify')) {
        return 'update';
    }
    if (lower.includes('delete') || lower.includes('remove')) {
        return 'delete';
    }
    return null;
}
async function handleWorkflowStep(message, workflow, sessionUserId) {
    const command = isWorkflowCommand(message);
    if (command?.command === 'cancel') {
        clearWorkflow(workflow.id);
        return {
            response: 'Workflow cancelled. How else can I help you?',
            updatedWorkflow: null,
        };
    }
    if (command?.command === 'back' && workflow.currentStep !== 'init') {
        const steps = workflow.data.entityType
            ? workflow.data.entityType
            : 'project';
        workflow.currentStep = 'init';
        workflow.status = 'collecting';
        return {
            response: `Let's start over. ${(0, workflow_types_1.getStepPrompt)('init', steps)}`,
            updatedWorkflow: workflow,
        };
    }
    if (command?.command === 'skip') {
        const nextStep = (0, workflow_types_1.getNextStep)(workflow.currentStep, workflow.entityType);
        workflow.currentStep = nextStep;
        workflow.status = nextStep === 'executing' ? 'executing' : 'collecting';
        if ((0, workflow_types_1.isConfirmationStep)(nextStep)) {
            return {
                response: `${(0, workflow_types_1.getStepPrompt)(nextStep, workflow.entityType)}\n\nHere are the details:\n${formatWorkflowData(workflow.data)}`,
                updatedWorkflow: workflow,
            };
        }
        return {
            response: (0, workflow_types_1.getStepPrompt)(nextStep, workflow.entityType),
            updatedWorkflow: workflow,
        };
    }
    if ((0, workflow_types_1.isConfirmationStep)(workflow.currentStep)) {
        if (command?.command !== 'confirm') {
            return {
                response: 'Please answer with "yes" to confirm or "no" to cancel.',
                updatedWorkflow: workflow,
            };
        }
        workflow.currentStep = 'executing';
        workflow.status = 'executing';
        return {
            response: await executeWorkflowAction(workflow, sessionUserId),
            updatedWorkflow: workflow,
        };
    }
    const fieldName = getFieldForStep(workflow.currentStep);
    if (fieldName) {
        workflow.data.stepData = (0, workflow_types_1.mergeWorkflowData)(workflow.data.stepData, { [fieldName]: message });
    }
    const nextStep = (0, workflow_types_1.getNextStep)(workflow.currentStep, workflow.entityType);
    workflow.currentStep = nextStep;
    workflow.status = nextStep === 'executing' ? 'executing' : 'collecting';
    if ((0, workflow_types_1.isConfirmationStep)(nextStep)) {
        return {
            response: `${(0, workflow_types_1.getStepPrompt)(nextStep, workflow.entityType)}\n\nHere are the details:\n${formatWorkflowData(workflow.data)}`,
            updatedWorkflow: workflow,
        };
    }
    return {
        response: (0, workflow_types_1.getStepPrompt)(nextStep, workflow.entityType),
        updatedWorkflow: workflow,
    };
}
function formatWorkflowData(data) {
    const stepData = data.stepData;
    if (!stepData || Object.keys(stepData).length === 0) {
        return 'No data collected yet.';
    }
    return Object.entries(stepData)
        .map(([key, value]) => {
        const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
        return `- **${label}**: ${value}`;
    })
        .join('\n');
}
function getFieldForStep(step) {
    const fieldMap = {
        collect_name: 'name',
        collect_description: 'description',
        collect_assignee: 'assigneeId',
        collect_date: 'dueDate',
    };
    return fieldMap[step] || null;
}
async function executeWorkflowAction(workflow, userId) {
    const { entityType, action, data } = workflow;
    const stepData = data.stepData;
    try {
        let toolName = '';
        const toolArgs = {};
        switch (entityType) {
            case 'project':
                toolName = 'create_project';
                toolArgs.name = stepData.name;
                if (stepData.description)
                    toolArgs.description = stepData.description;
                break;
            case 'task':
                toolName = 'create_task';
                toolArgs.title = stepData.name;
                if (stepData.description)
                    toolArgs.description = stepData.description;
                if (stepData.assigneeId)
                    toolArgs.assigneeId = stepData.assigneeId;
                if (stepData.dueDate)
                    toolArgs.dueDate = stepData.dueDate;
                break;
            case 'team':
                toolName = 'create_team';
                toolArgs.name = stepData.name;
                if (stepData.description)
                    toolArgs.description = stepData.description;
                break;
            case 'department':
                toolName = 'create_department';
                toolArgs.name = stepData.name;
                if (stepData.description)
                    toolArgs.description = stepData.description;
                break;
            case 'organization':
                toolName = 'create_organization';
                toolArgs.name = stepData.name;
                if (stepData.description)
                    toolArgs.description = stepData.description;
                break;
            default:
                return 'I apologize, but I cannot execute this type of workflow yet.';
        }
        const result = await (0, client_1.callMCPTool)(toolName, toolArgs);
        const textContent = result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join('\n');
        clearWorkflow(workflow.id);
        return `Successfully created ${entityType}!\n\n${textContent}\n\nIs there anything else I can help you with?`;
    }
    catch (error) {
        clearWorkflow(workflow.id);
        return `I encountered an error while creating the ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}\n\nWould you like to try again?`;
    }
}
async function handleToolCalls(toolCalls) {
    const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
        const result = await (0, client_1.callMCPTool)(toolCall.name, toolCall.input);
        const textContent = result.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text || '')
            .join('\n');
        return {
            tool_name: toolCall.name,
            content: textContent,
        };
    }));
    return toolResults;
}
async function callOpenRouter(messages, tools, stream = false) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'AltiTeam',
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-small-3.1-24b-instruct:free',
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            tools: tools.length > 0 ? tools : undefined,
            stream,
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
    }
    if (stream) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        return new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]')
                                continue;
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content ||
                                    parsed.choices?.[0]?.delta?.tool_use?.input?.text ||
                                    parsed.choices?.[0]?.message?.content ||
                                    '';
                                if (content) {
                                    controller.enqueue(encoder.encode(content));
                                }
                            }
                            catch {
                                // Ignore parsing errors
                            }
                        }
                    }
                }
                controller.close();
            },
        });
    }
    const result = await response.json();
    return {
        content: result.choices?.[0]?.message?.content || '',
        tool_calls: result.choices?.[0]?.message?.tool_calls || [],
    };
}
async function processStreamingMessage(messages, conversationId) {
    const encoder = new TextEncoder();
    const workflow = conversationId ? getWorkflow(conversationId) : null;
    const lastUserMessage = messages[messages.length - 1];
    if (workflow && lastUserMessage?.role === 'user') {
        const { response, updatedWorkflow } = await handleWorkflowStep(lastUserMessage.content, workflow, 'user');
        if (updatedWorkflow && conversationId) {
            setWorkflow(conversationId, updatedWorkflow);
        }
        return new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(response));
                controller.close();
            },
        });
    }
    if (lastUserMessage?.role === 'user' && !workflow && conversationId) {
        const content = lastUserMessage.content.toLowerCase();
        const entityType = extractEntityTypeFromContent(content);
        const action = extractActionFromContent(content);
        if (entityType && action === 'create') {
            const newWorkflow = (0, workflow_types_1.createWorkflowState)(conversationId, entityType, action);
            setWorkflow(conversationId, newWorkflow);
            return new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode((0, workflow_types_1.getStepPrompt)('init', entityType)));
                    controller.enqueue(encoder.encode('\n\n'));
                    controller.enqueue(encoder.encode((0, workflow_types_1.getStepPrompt)('collect_name', entityType)));
                    controller.close();
                },
            });
        }
    }
    return new ReadableStream({
        async start(controller) {
            try {
                const tools = await (0, client_1.getMCPTools)();
                const toolDefs = tools.map((tool) => ({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: {
                            type: 'object',
                            properties: tool.inputSchema.properties,
                            required: tool.inputSchema.required || [],
                        },
                    },
                }));
                const stream = (await callOpenRouter(messages, toolDefs, true));
                const reader = stream.getReader();
                let hasToolUse = false;
                let toolUseData = [];
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]')
                                continue;
                            try {
                                const parsed = JSON.parse(data);
                                const textDelta = parsed.choices?.[0]?.delta?.content;
                                const toolUse = parsed.choices?.[0]?.delta?.tool_use;
                                if (textDelta) {
                                    controller.enqueue(encoder.encode(textDelta));
                                }
                                if (toolUse) {
                                    hasToolUse = true;
                                    toolUseData.push({
                                        name: toolUse.name,
                                        input: toolUse.input || {},
                                    });
                                }
                            }
                            catch {
                                // Ignore parsing errors
                            }
                        }
                    }
                }
                if (hasToolUse && toolUseData.length > 0) {
                    controller.enqueue(encoder.encode('\n\n[Processing tool calls...]\n'));
                    const toolResults = await handleToolCalls(toolUseData);
                    const toolResultMessage = toolResults
                        .map((r) => `[Tool: ${r.tool_name}]\n${r.content}`)
                        .join('\n\n');
                    controller.enqueue(encoder.encode(toolResultMessage + '\n\n'));
                    const continuationMessages = [
                        ...messages,
                        { role: 'assistant', content: 'Tool results processed' },
                        {
                            role: 'user',
                            content: `Here are the results from the tools I called:\n\n${toolResultMessage}\n\nPlease provide a helpful response based on these results.`,
                        },
                    ];
                    const continuationStream = (await callOpenRouter(continuationMessages, toolDefs, true));
                    const continuationReader = continuationStream.getReader();
                    const decoder = new TextDecoder();
                    while (true) {
                        const { done, value } = await continuationReader.read();
                        if (done)
                            break;
                        controller.enqueue(value);
                    }
                }
                controller.close();
            }
            catch (error) {
                console.error('Stream error:', error);
                controller.error(error);
            }
        },
    });
}
const decoder = new TextDecoder();
async function POST(request) {
    try {
        const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
        if (!session?.user?.id) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { messages, stream = false } = body;
        if (!messages || !Array.isArray(messages)) {
            return server_1.NextResponse.json({ error: 'messages array is required' }, { status: 400 });
        }
        if (!process.env.OPENROUTER_API_KEY) {
            return server_1.NextResponse.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
        }
        if (stream) {
            const conversationId = body.conversationId || `conv-${Date.now()}`;
            const readableStream = await processStreamingMessage(messages, conversationId);
            return new Response(readableStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        }
        const tools = await (0, client_1.getMCPTools)();
        const toolDefs = tools.map((tool) => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: tool.inputSchema.properties,
                    required: tool.inputSchema.required || [],
                },
            },
        }));
        const result = (await callOpenRouter(messages, toolDefs, false));
        let finalContent = result.content;
        if (result.tool_calls && result.tool_calls.length > 0) {
            const toolCalls = result.tool_calls.map((tc) => ({
                name: tc.function.name,
                input: JSON.parse(tc.function.arguments || '{}'),
            }));
            const toolResults = await handleToolCalls(toolCalls);
            const toolResultMessage = toolResults
                .map((r) => `[Tool: ${r.tool_name}]\n${r.content}`)
                .join('\n\n');
            const continuationMessages = [
                ...messages,
                { role: 'assistant', content: result.content },
                {
                    role: 'user',
                    content: `Here are the results from the tools I called:\n\n${toolResultMessage}\n\nPlease provide a helpful response based on these results.`,
                },
            ];
            const continuation = (await callOpenRouter(continuationMessages, toolDefs, false));
            finalContent = continuation.content;
        }
        return server_1.NextResponse.json({ message: finalContent });
    }
    catch (error) {
        console.error('Chat error:', error);
        return server_1.NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
}
