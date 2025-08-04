import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, Tag, AlertTriangle, CheckCircle, FileText, Edit2, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Incident, IncidentComment } from '../../types';
import {
  getSeverityColor,
  getStatusColor,
  formatDate,
  getIncidentTypeLabel,
  getSeverityLabel,
  getStatusLabel
} from '../../utils/helpers';

interface IncidentDetailsModalProps {
  incident: Incident;
  onClose: () => void;
}

export default function IncidentDetailsModal({ incident, onClose }: IncidentDetailsModalProps) {
  const { users, currentUser } = useApp();
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuario desconocido';
  };

  useEffect(() => {
    fetchComments();
  }, [incident.id]);

  async function fetchComments() {
    const { data, error } = await supabase
      .from<IncidentComment>('incident_comments')
      .select('*')
      .eq('incident_id', incident.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al cargar comentarios:', error);
    } else {
      setComments(data);
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    setPosting(true);
    const { error } = await supabase
      .from('incident_comments')
      .insert([{ incident_id: incident.id, author_id: currentUser.id, comentario: newComment.trim() }]);

    if (error) {
      console.error('Error guardando comentario:', error);
    } else {
      setNewComment('');
      await fetchComments();
    }
    setPosting(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] flex overflow-hidden">
        {/* Left: Details */}
        <div className="w-3/5 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`w-6 h-6 ${incident.severity === 'critical' ? 'text-red-600' : incident.severity === 'high' ? 'text-orange-600' : incident.severity === 'medium' ? 'text-yellow-500' : 'text-green-600'}`} />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{incident.title}</h2>
                <p className="text-sm text-gray-500">ID: {incident.id}</p>
              </div>
            </div>
            <div className="flex space-x-2">

                            <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                <Edit2 className="w-4 h-4 mr-2" /> 
              </button>
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estado */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-1 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mr-1" /> Estado
              </div>
              <span className={`inline-block px-2 py-1 text-xs font-semibold border ${getStatusColor(incident.status)}`}>{getStatusLabel(incident.status)}</span>
            </div>
            {/* Severidad */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-1 text-sm text-gray-700">
                <AlertTriangle className="w-4 h-4 mr-1" /> Severidad
              </div>
              <span className={`inline-block px-2 py-1 text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>{getSeverityLabel(incident.severity)}</span>
            </div>
            {/* Tipo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-1 text-sm text-gray-700">
                <FileText className="w-4 h-4 mr-1" /> Tipo
              </div>
              <p className="text-sm text-gray-900">{getIncidentTypeLabel(incident.type)}</p>
            </div>
            {/* Asignado */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-1 text-sm text-gray-700">
                <User className="w-4 h-4 mr-1" /> Asignado a
              </div>
              <p className="text-sm text-gray-900">{getUserName(incident.assignedTo)}</p>
            </div>
          </div>

          {/* Secciones de descripción, impacto, resolución ... */}
          <Section title="Descripción" content={incident.description} />
          {incident.impact && <Section title="Impacto" content={incident.impact} variant="warning" />}
          {incident.resolution && <Section title="Resolución" content={incident.resolution} variant="success" />}
          {incident.affectedSystems.length > 0 && (
            <TagList title="Sistemas Afectados" items={incident.affectedSystems} color="blue" />
          )}
          {incident.tags.length > 0 && (
            <TagList title="Etiquetas" items={incident.tags} color="gray" icon={<Tag className="w-3 h-3 mr-1" />} />
          )}

          {/* Cronología */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Cronología</h3>
            <TimelineItem icon={<Calendar className="w-4 h-4 text-gray-400" />} label="Creado" value={`${formatDate(incident.createdAt)} por ${getUserName(incident.reportedBy)}`} />
            <TimelineItem icon={<Clock className="w-4 h-4 text-gray-400" />} label="Última actualización" value={formatDate(incident.updatedAt)} />
            {incident.resolvedAt && <TimelineItem icon={<CheckCircle className="w-4 h-4 text-green-500" />} label="Resuelto" value={formatDate(incident.resolvedAt)} />}
          </div>
        </div>

        {/* Right: Comments */}
        <div className="w-2/5 bg-white border-l border-gray-200 flex flex-col p-6">
          <h3 className="text-lg font-semibold mb-4">Comentarios</h3>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {comments.map(c => (
              <div key={c.id} className="bg-gray-50 p-3 rounded-md shadow-sm">
                <p className="text-gray-800">{c.comentario}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(new Date(c.created_at))} - {getUserName(c.author_id)}
                </p>
              </div>
            ))}
          </div>
          {/* Comment form */}
          <form onSubmit={handleAddComment} className="flex items-center space-x-2">
            <textarea
              rows={2}
              className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agrega un comentario..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {posting ? <Send className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable sub-components for cleaner JSX
function Section({ title, content, variant }: { title: string; content: string; variant?: 'warning' | 'success' }) {
  const bg = variant === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : variant === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-800';
  return (
    <section>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className={`p-4 rounded-lg border ${bg}`}>
        <p>{content}</p>
      </div>
    </section>
  );
}

function TagList({ title, items, color, icon }: { title: string; items: string[]; color: string; icon?: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className={`flex items-center ${icon ? '' : 'justify-center'} bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm`}>{icon}{item}</span>
        ))}
      </div>
    </section>
  );
}

function TimelineItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      {icon}
      <span>{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
