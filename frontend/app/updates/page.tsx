"use client";
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react";

const TeamUpdatesDashboard = () => {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('teamTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [newTask, setNewTask] = useState({
    title: "",
    assignee: "",
    status: "pending",
    description: "",
    progress: 0
  });

  useEffect(() => {
    localStorage.setItem('teamTasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    const task = {
      id: Date.now(),
      ...newTask,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, task]);
    setNewTask({
      title: "",
      assignee: "",
      status: "pending",
      description: "",
      progress: 0
    });
  };

  const updateTaskProgress = (taskId, action) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        switch(action) {
          case 'increment':
            return { 
              ...task, 
              progress: Math.min(task.progress + 25, 100),
              status: task.progress + 25 >= 100 ? 'completed' : task.status
            };
          case 'complete':
            return { 
              ...task, 
              progress: 100,
              status: 'completed'
            };
          default:
            return task;
        }
      }
      return task;
    }));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="text-green-500" />;
      case 'pending': return <Clock className="text-blue-500" />;
      default: return <AlertCircle className="text-yellow-500" />;
    }
  };

  const calculateOverallProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gray-50 max-w-7xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Support Task Management</h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="w-64">
                  <Progress value={calculateOverallProgress()} className="h-2" />
                </div>
                <span className="text-sm text-gray-600">
                  Overall Progress: {calculateOverallProgress()}%
                </span>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">+ New Task</Button>
              </DialogTrigger>
              {/* ...existing dialog content... */}
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <Card 
            key={task.id} 
            className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                </div>
                <Badge 
                  variant={task.status === 'completed' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {task.assignee}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(task.createdAt).toLocaleString()}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {task.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>
                <Progress 
                  value={task.progress} 
                  className="h-1.5" 
                />
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateTaskProgress(task.id, 'increment')}
                    disabled={task.status === 'completed'}
                    className="flex-1"
                  >
                    Update
                  </Button>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => updateTaskProgress(task.id, 'complete')}
                    disabled={task.status === 'completed'}
                    className="flex-1"
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamUpdatesDashboard;