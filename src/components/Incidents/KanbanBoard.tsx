import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import { Incident, Status } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  getSeverityColor, 
  formatDate, 
  getIncidentTypeLabel, 
  getSeverityLabel 
} from '../../utils/helpers';

interface KanbanBoardProps {
  incidents: Incident[];
}

const statusConfig = {
  open: {
    title: 'Abiertos',
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-500',
    count: 0
  },
  in_progress: {
    title: 'En Progreso',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-500',
    count: 0
  },
  resolved: {
    title: 'Resueltos',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-500',
    count: 0
  },
  closed: {
    title: 'Cerrados',
    color: 'bg-gray-50 border-gray-200',
    headerColor: 'bg-gray-500',
    count: 0
  }
};

export default function KanbanBoard({ incidents }: KanbanBoardProps) {
  const { users, updateIncident } = useApp();
  const [draggedIncident, setDraggedIncident] = useState<string | null>(null);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Sin asignar';
  };

  const getIncidentsByStatus = (status: Status) => {
    return incidents.filter(incident => incident.status === status);
  };

  const handleDragStart = (start: any) => {
    setDraggedIncident(start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedIncident(null);
    
    if (!result.destination) {
      return;
    }

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Status;
    
    updateIncident(draggableId, { status: newStatus });
  };

  const IncidentCard = ({ incident, index }: { incident: Incident; index: number }) => (
    <Draggable draggableId={incident.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          } ${draggedIncident === incident.id ? 'opacity-50' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-gray-500">{incident.id}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                {getSeverityLabel(incident.severity)}
              </span>
            </div>
            <AlertTriangle className={`w-4 h-4 ${
              incident.severity === 'critical' ? 'text-red-500' :
              incident.severity === 'high' ? 'text-orange-500' :
              incident.severity === 'medium' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </div>
          
          <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {incident.title}
          </h4>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {incident.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {getIncidentTypeLabel(incident.type)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{getUserName(incident.assignedTo)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(incident.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {incident.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {incident.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              {incident.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{incident.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  const KanbanColumn = ({ status, title, color, headerColor }: { 
    status: Status; 
    title: string; 
    color: string; 
    headerColor: string; 
  }) => {
    const columnIncidents = getIncidentsByStatus(status);
    
    return (
      <div className={`rounded-lg border-2 ${color} min-h-[600px] flex flex-col`}>
        <div className={`${headerColor} text-white px-4 py-3 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm font-medium">
              {columnIncidents.length}
            </span>
          </div>
        </div>
        
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-4 transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50' : ''
              }`}
            >
              {columnIncidents.map((incident, index) => (
                <IncidentCard key={incident.id} incident={incident} index={index} />
              ))}
              {provided.placeholder}
              
              {columnIncidents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay incidentes</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <KanbanColumn 
          status="open" 
          title={statusConfig.open.title}
          color={statusConfig.open.color}
          headerColor={statusConfig.open.headerColor}
        />
        <KanbanColumn 
          status="in_progress" 
          title={statusConfig.in_progress.title}
          color={statusConfig.in_progress.color}
          headerColor={statusConfig.in_progress.headerColor}
        />
        <KanbanColumn 
          status="resolved" 
          title={statusConfig.resolved.title}
          color={statusConfig.resolved.color}
          headerColor={statusConfig.resolved.headerColor}
        />
        <KanbanColumn 
          status="closed" 
          title={statusConfig.closed.title}
          color={statusConfig.closed.color}
          headerColor={statusConfig.closed.headerColor}
        />
      </div>
    </DragDropContext>
  );
}