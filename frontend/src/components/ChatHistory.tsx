import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Calendar, Clock } from 'lucide-react';
import { chatHistoryAPI, type ChatSession } from '../services/apiService';

export function ChatHistory() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await chatHistoryAPI.getChatHistory(20);
            setSessions(data);
        } catch (err) {
            console.error('Failed to load chat history:', err);
            setError('Failed to load history');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (sessionId: string) => {
        if (!confirm('Delete this chat session?')) return;

        try {
            await chatHistoryAPI.deleteChatSession(sessionId);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        } catch (err) {
            console.error('Failed to delete session:', err);
            alert('Failed to delete session');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No chat history yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Chat History</span>
            </h3>

            <div className="space-y-3">
                {sessions.map((session) => (
                    <div
                        key={session._id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                        <div
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedSession(
                                expandedSession === session._id ? null : session._id
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800">
                                        {session.topic || 'Chat Session'}
                                    </h4>
                                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(session.createdAt).toLocaleTimeString()}</span>
                                        </span>
                                        <span>{session.messages.length} messages</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSession(session.sessionId);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {expandedSession === session._id && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50 max-h-96 overflow-y-auto">
                                <div className="space-y-3">
                                    {session.messages.map((message, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg ${message.role === 'user'
                                                    ? 'bg-green-100 ml-8'
                                                    : 'bg-white mr-8'
                                                }`}
                                        >
                                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                                {message.role === 'user' ? 'You' : 'AI'}
                                            </p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                {message.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
