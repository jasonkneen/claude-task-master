// Basic types - ideally share these with the backend or generate them
export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  dependencies: string[] | string; // CLI output might be string, JSON should be array
}

export interface TaskDetail extends TaskSummary {
  description?: string;
  implementationDetails?: string;
  testStrategy?: string;
  subtasks?: any[]; // Define more strictly later
}

const API_BASE_URL = '/api'; // Use relative path

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
    throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
  }
  
  // First try to parse as JSON
  try {
    return await response.json() as Promise<T>;
  } catch (error) {
    // If JSON parsing fails, try to parse the text response
    const text = await response.text();
    
    // If the response is empty, return an empty result based on the expected type
    if (!text.trim()) {
      return (Array.isArray([] as unknown as T) ? [] : {}) as T;
    }
    
    // Try to extract JSON from the text response (in case it's wrapped in other text)
    try {
      // Look for JSON-like content in the text
      const jsonMatch = text.match(/\[.*\]|\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
    } catch (jsonError) {
      console.error('Failed to extract JSON from text response:', jsonError);
    }
    
    // If we're expecting an array, try to parse the text as a list of items
    if (Array.isArray([] as unknown as T)) {
      // Split by lines and filter out empty lines
      const lines = text.split('\n').filter(line => line.trim());
      
      // Try to extract task information from each line
      const tasks = lines.map(line => {
        // Example format: "1: Install backend deps (done) [high]"
        const match = line.match(/(\d+):\s+(.*?)\s+\((.*?)\)\s+\[(.*?)\]/);
        if (match) {
          const [, id, title, status, priority] = match;
          return {
            id,
            title,
            status,
            priority,
            dependencies: [] // Can't easily extract from this format
          } as unknown as T;
        }
        return null;
      }).filter(Boolean);
      
      if (tasks.length > 0) {
        return tasks as unknown as T;
      }
    }
    
    // If all parsing attempts fail, throw an error
    throw new Error(`Failed to parse response: ${text}`);
  }
}

export async function getTasks(status?: string): Promise<TaskSummary[]> {
  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/tasks?${params.toString()}`);
    console.debug('Fetch /api/tasks status:', response.status);
    
    return await handleResponse<TaskSummary[]>(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    
    // For development/fallback, return tasks from tasks.json
    // In a production environment, you might want to rethrow the error
    console.warn('Falling back to placeholder task data');
    
    // Return placeholder data
    return [
      { id: '1', title: 'Install backend deps', status: 'done', priority: 'high', dependencies: [] },
      { id: '2', title: 'Implement port finding', status: 'done', priority: 'high', dependencies: ['1'] },
      { id: '3', title: 'Create API endpoints', status: 'in-progress', priority: 'high', dependencies: ['2'] },
      { id: '4', title: 'Implement GET /api/tasks', status: 'done', priority: 'high', dependencies: ['2'] },
      { id: '5', title: 'Implement POST /api/tasks', status: 'in-progress', priority: 'medium', dependencies: ['2'] },
      { id: '6', title: 'Implement DELETE /api/tasks', status: 'pending', priority: 'low', dependencies: ['2'] },
      { id: '7', title: 'Create UI components', status: 'done', priority: 'high', dependencies: [] },
      { id: '8', title: 'Create Task List component', status: 'done', priority: 'medium', dependencies: ['7'] },
      { id: '9', title: 'Create Task Detail component', status: 'done', priority: 'medium', dependencies: ['7'] },
      { id: '10', title: 'Implement task filtering', status: 'pending', priority: 'low', dependencies: ['8'] },
      { id: '11', title: 'Add task sorting', status: 'pending', priority: 'low', dependencies: ['8'] },
      { id: '12', title: 'Implement task search', status: 'pending', priority: 'medium', dependencies: ['8'] },
    ];
  }
}

export async function getTaskById(id: string): Promise<TaskDetail | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
    
    // Handle 404 case
    if (response.status === 404) {
      console.warn(`Task with ID ${id} not found`);
      return null;
    }
    
    console.debug(`Fetch /api/tasks/${id} status:`, response.status);
    
    return await handleResponse<TaskDetail>(response);
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    
    // For development/fallback, return a placeholder task
    // In a production environment, you might want to rethrow the error
    console.warn(`Falling back to placeholder task data for ID ${id}`);
    
    // Return a placeholder task based on the ID
    const placeholderTasks = await getTasks();
    const task = placeholderTasks.find(t => t.id === id);
    
    if (task) {
      return {
        ...task,
        description: `Description for task ${id}`,
        implementationDetails: `Implementation details for task ${id}`,
        testStrategy: `Test strategy for task ${id}`
      };
    }
    
    return null;
  }
}

// Add functions for other endpoints (next, setStatus) later