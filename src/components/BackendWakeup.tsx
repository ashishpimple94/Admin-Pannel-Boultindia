import React, { useState, useEffect } from 'react';
import { Server, Clock, Wifi, CheckCircle } from 'lucide-react';

interface BackendWakeupProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const BackendWakeup: React.FC<BackendWakeupProps> = ({ isVisible, onComplete }) => {
  const [stage, setStage] = useState<'waking' | 'connecting' | 'ready'>('waking');
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setStage('ready');
          setTimeout(() => {
            onComplete?.();
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 600);

    // Stage transitions
    setTimeout(() => setStage('connecting'), 15000);
    setTimeout(() => setStage('ready'), 45000);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'waking':
        return {
          icon: <Server className="animate-pulse" size={48} />,
          title: 'Backend Service is Waking Up',
          description: 'Render service is starting up from sleep mode...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'connecting':
        return {
          icon: <Wifi className="animate-bounce" size={48} />,
          title: 'Establishing Connection',
          description: 'Connecting to database and initializing services...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'ready':
        return {
          icon: <CheckCircle size={48} />,
          title: 'Backend Ready!',
          description: 'Connection established successfully.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`max-w-md w-full ${stageInfo.bgColor} ${stageInfo.borderColor} border-2 rounded-2xl p-8 shadow-2xl`}>
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className={`${stageInfo.color} flex justify-center`}>
            {stageInfo.icon}
          </div>

          {/* Title */}
          <div>
            <h2 className={`text-2xl font-bold ${stageInfo.color} mb-2`}>
              {stageInfo.title}
            </h2>
            <p className="text-gray-600">
              {stageInfo.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ease-out ${
                  stage === 'ready' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{Math.round(progress)}% Complete</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {timeElapsed}s
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/50 rounded-lg p-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Why does this happen?</strong>
            </p>
            <p>
              Render's free tier puts services to sleep after 15 minutes of inactivity. 
              The first request takes 30-60 seconds to wake up the service.
            </p>
          </div>

          {/* Estimated Time */}
          {stage === 'waking' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Estimated time: 30-60 seconds
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendWakeup;