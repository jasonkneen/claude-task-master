import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faNetworkWired, faBolt, faUserPlus, faTasks,
  faProjectDiagram, faChartLine, faBell,
  faCheckCircle, faFilter, faSort, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Import API services
import { getTasks, TaskSummary } from '@/services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch tasks from the API
        const fetchedTasks = await getTasks();
        console.log("Fetched tasks:", fetchedTasks);
        
        // Calculate task statistics
        const total = fetchedTasks.length;
        const completed = fetchedTasks.filter(task => task.status === 'done').length;
        const inProgress = fetchedTasks.filter(task => task.status === 'in-progress').length;
        const pending = fetchedTasks.filter(task => task.status === 'pending').length;
        
        setTaskStats({
          total,
          completed,
          inProgress,
          pending
        });
        
        setTasks(fetchedTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter tasks based on status
  const filteredTasks = statusFilter 
    ? tasks.filter(task => task.status === statusFilter)
    : tasks;

  // Chart data for task progress
  const taskProgressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Completed Tasks',
      data: [
        Math.round(taskStats.completed * 0.25), 
        Math.round(taskStats.completed * 0.5), 
        Math.round(taskStats.completed * 0.75), 
        taskStats.completed
      ],
      borderColor: '#00ff00',
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      pointRadius: 0
    }]
  };
  
  // Chart data for task types
  const taskTypeData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [{
      data: [
        tasks.filter(task => task.priority === 'high').length,
        tasks.filter(task => task.priority === 'medium').length,
        tasks.filter(task => task.priority === 'low').length
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };
  
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const
      }
    },
    cutout: '65%'
  };

  return (
    <div className="container mx-auto px-4 py-6 text-gray-200">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-green-600 pb-4 mb-8">
        <div className="flex items-center">
          <div className="w-4 h-12 bg-green-500 mr-3"></div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">TASK MASTER</h1>
            <p className="text-xs text-gray-500">TASK MANAGEMENT DASHBOARD</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-xs">
            <span className="text-yellow-400">TOTAL TASKS: </span>
            <span className="text-green-400">{taskStats.total}</span>
          </div>
          <span className="text-gray-500">|</span>
          <div className="text-xs">
            <span className="text-yellow-400">COMPLETED: </span>
            <span className="text-green-400">{taskStats.completed}</span>
          </div>
          <span className="text-gray-500">|</span>
          <div className="text-xs">
            <span className="text-yellow-400">IN PROGRESS: </span>
            <span className="text-green-400">{taskStats.inProgress}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* System Status */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-green-500">
                <FontAwesomeIcon icon={faNetworkWired} className="text-green-500" />
              </div>
              <div className="ml-3">
                <h3 className="font-bold text-green-400">TASK SYSTEM</h3>
                <p className="text-xs text-gray-500">TASK MANAGEMENT COORDINATOR</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">TOTAL TASKS</div>
                <div className="text-green-400">{taskStats.total}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">COMPLETED</div>
                <div className="text-green-400">{taskStats.completed}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">IN PROGRESS</div>
                <div className="text-green-400">{taskStats.inProgress}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">PENDING</div>
                <div className="text-green-400">{taskStats.pending}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="font-bold text-green-500 mb-3 flex items-center">
              <FontAwesomeIcon icon={faBolt} className="mr-2" /> QUICK ACTIONS
            </h3>
            <div className="space-y-2">
              <button 
                className="w-full bg-gray-800 hover:bg-green-900 text-green-400 text-left text-sm py-2 px-3 rounded flex items-center"
              >
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> CREATE TASK
              </button>
              <button 
                className="w-full bg-gray-800 hover:bg-green-900 text-green-400 text-left text-sm py-2 px-3 rounded flex items-center"
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2" /> FILTER TASKS
              </button>
              <button 
                className="w-full bg-gray-800 hover:bg-green-900 text-green-400 text-left text-sm py-2 px-3 rounded flex items-center"
              >
                <FontAwesomeIcon icon={faSort} className="mr-2" /> SORT TASKS
              </button>
              <button 
                className="w-full bg-gray-800 hover:bg-green-900 text-green-400 text-left text-sm py-2 px-3 rounded flex items-center"
              >
                <FontAwesomeIcon icon={faSearch} className="mr-2" /> SEARCH TASKS
              </button>
            </div>
          </div>

          {/* Task Filters */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <h3 className="font-bold text-green-500 mb-3 flex items-center">
              <FontAwesomeIcon icon={faFilter} className="mr-2" /> TASK FILTERS
            </h3>
            <div className="space-y-2">
              <button 
                className={`w-full ${statusFilter === null ? 'bg-green-900' : 'bg-gray-800 hover:bg-green-900'} text-green-400 text-left text-sm py-2 px-3 rounded flex items-center`}
                onClick={() => setStatusFilter(null)}
              >
                <FontAwesomeIcon icon={faTasks} className="mr-2" /> ALL TASKS
              </button>
              <button 
                className={`w-full ${statusFilter === 'done' ? 'bg-green-900' : 'bg-gray-800 hover:bg-green-900'} text-green-400 text-left text-sm py-2 px-3 rounded flex items-center`}
                onClick={() => setStatusFilter('done')}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> COMPLETED
              </button>
              <button 
                className={`w-full ${statusFilter === 'in-progress' ? 'bg-green-900' : 'bg-gray-800 hover:bg-green-900'} text-green-400 text-left text-sm py-2 px-3 rounded flex items-center`}
                onClick={() => setStatusFilter('in-progress')}
              >
                <FontAwesomeIcon icon={faProjectDiagram} className="mr-2" /> IN PROGRESS
              </button>
              <button 
                className={`w-full ${statusFilter === 'pending' ? 'bg-green-900' : 'bg-gray-800 hover:bg-green-900'} text-green-400 text-left text-sm py-2 px-3 rounded flex items-center`}
                onClick={() => setStatusFilter('pending')}
              >
                <FontAwesomeIcon icon={faBell} className="mr-2" /> PENDING
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Task Statistics */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4 bg-gray-950 flex justify-between items-center">
              <h2 className="font-bold text-green-400 flex items-center">
                <FontAwesomeIcon icon={faChartLine} className="mr-2" /> TASK STATISTICS
              </h2>
              <div className="text-xs flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1 pulsing-border"></div>
                <span className="text-green-400">REALTIME MONITORING</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div className="bg-gray-950 p-3 rounded border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-green-400">TASK PROGRESS</h3>
                  <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                    {Math.round((taskStats.completed / (taskStats.total || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-40">
                  <Line data={taskProgressData} options={chartOptions} />
                </div>
              </div>
              <div className="bg-gray-950 p-3 rounded border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-green-400">TASK PRIORITIES</h3>
                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">DISTRIBUTION</span>
                </div>
                <div className="h-40">
                  <Doughnut data={taskTypeData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 p-4 bg-gray-950 flex justify-between items-center">
              <h2 className="font-bold text-green-400 flex items-center">
                <FontAwesomeIcon icon={faTasks} className="mr-2" /> TASK LIST
              </h2>
              <div className="text-xs">
                <span className="text-yellow-400">SHOWING: </span>
                <span className="text-green-400">{filteredTasks.length} TASKS</span>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  <p className="mt-2 text-gray-400">Loading tasks...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">
                  <p>Error: {error}</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <p>No tasks found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800 text-gray-400 text-xs">
                      <tr>
                        <th className="py-2 px-4 text-left">ID</th>
                        <th className="py-2 px-4 text-left">TITLE</th>
                        <th className="py-2 px-4 text-left">STATUS</th>
                        <th className="py-2 px-4 text-left">PRIORITY</th>
                        <th className="py-2 px-4 text-left">DEPENDENCIES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="border-t border-gray-800 hover:bg-gray-800">
                          <td className="py-3 px-4 text-gray-300">{task.id}</td>
                          <td className="py-3 px-4 text-gray-300">{task.title}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.status === 'done' ? 'bg-green-900 text-green-300' : 
                              task.status === 'in-progress' ? 'bg-blue-900 text-blue-300' : 
                              'bg-yellow-900 text-yellow-300'
                            }`}>
                              {task.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.priority === 'high' ? 'bg-red-900 text-red-300' : 
                              task.priority === 'medium' ? 'bg-orange-900 text-orange-300' : 
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {Array.isArray(task.dependencies) && task.dependencies.length > 0 
                              ? task.dependencies.join(', ') 
                              : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-800 pt-4 text-xs text-gray-600 flex justify-between items-center">
        <div>
          <p>TASK MASTER DASHBOARD v1.0</p>
        </div>
        <div>
          <p>STATUS: <span className="text-green-500">OPERATIONAL</span></p>
        </div>
      </footer>
    </div>
  );
}

export default App;
