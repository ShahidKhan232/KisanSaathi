import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Upload, 
  CheckSquare, 
  XSquare,
  ChevronRight,
  Calendar
} from 'lucide-react';
import type { ApplicationProgress, SchemeDocument, DocumentStatus } from '../types/SchemeTypes';

interface ApplicationProgressProps {
  progress: ApplicationProgress;
  onUploadDocument: (documentId: string, file: File) => Promise<void>;
  onUpdateNotes: (stepId: string, note: string) => Promise<void>;
}

export function ApplicationProgressTracker({
  progress,
  onUploadDocument,
  onUpdateNotes
}: ApplicationProgressProps) {
  const { i18n } = useTranslation();
  // no selectedDocumentId state needed
  const [newNote, setNewNote] = useState('');

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'uploaded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XSquare className="w-4 h-4" />;
      case 'uploaded': return <CheckSquare className="w-4 h-4" />;
      default: return <Upload className="w-4 h-4" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDocumentStatusText = (status: DocumentStatus) => {
    switch (status) {
      case 'verified':
        return i18n.language === 'en' ? 'Verified' : i18n.language === 'mr' ? 'सत्यापित' : 'सत्यापित';
      case 'rejected':
        return i18n.language === 'en' ? 'Rejected' : i18n.language === 'mr' ? 'नाकारले' : 'अस्वीकृत';
      case 'uploaded':
        return i18n.language === 'en' ? 'Uploaded' : i18n.language === 'mr' ? 'अपलोड केले' : 'अपलोड किया';
      default:
        return i18n.language === 'en' ? 'Pending' : i18n.language === 'mr' ? 'प्रलंबित' : 'लंबित';
    }
  };

  const handleFileUpload = async (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      await onUploadDocument(documentId, file);
      // Optionally show success message
    } catch (err) {
      console.error('Failed to upload document:', err);
      // Show error message
    }
  };

  const handleAddNote = async (stepId: string) => {
    if (!newNote.trim()) return;
    
    try {
      await onUpdateNotes(stepId, newNote);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {i18n.language === 'en' ? 'Application Progress' : i18n.language === 'mr' ? 'अर्ज प्रगती' : 'आवेदन प्रगति'}
          </h3>
          <span className="text-sm text-gray-500">
            {i18n.language === 'en' ? 'Started on' : i18n.language === 'mr' ? 'सुरू केले' : 'शुरू किया'}: {new Date(progress.startedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
            <div 
              className="bg-green-500 rounded-r" 
              style={{ width: `${(progress.currentStep / progress.totalSteps) * 100}%` }} 
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>{progress.currentStep} of {progress.totalSteps} steps completed</span>
            <span>Last updated: {new Date(progress.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-4">
        {progress.steps.map((step, index) => (
          <div key={step.id} className="bg-white rounded-lg shadow-sm border p-4">
            {/* Step Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full ${getStepStatusColor(step.status)}`}>
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-gray-800">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStepStatusColor(step.status)}`}>
                {step.status}
              </span>
            </div>

            {/* Required Documents */}
            {step.requiredDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {i18n.language === 'en' ? 'Required Documents' : i18n.language === 'mr' ? 'आवश्यक कागदपत्रे' : 'आवश्यक दस्तावेज'}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {step.requiredDocuments.map(docId => {
                    const doc = progress.documents.find(d => d.id === docId) as SchemeDocument;
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.format.toUpperCase()} • Max {doc.maxSize}MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                            {getStatusIcon(doc.status)}
                            <span className="ml-1">{getDocumentStatusText(doc.status)}</span>
                          </span>
                          {doc.status === 'pending' && (
                            <label className="ml-2 cursor-pointer text-blue-600 hover:text-blue-700">
                              <input
                                type="file"
                                className="hidden"
                                accept={doc.format === 'any' ? undefined : `.${doc.format}`}
                                onChange={(e) => handleFileUpload(doc.id, e)}
                              />
                              <Upload className="w-5 h-5" />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {step.nextSteps && step.nextSteps.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {i18n.language === 'en' ? 'Next Steps' : i18n.language === 'mr' ? 'पुढील पावले' : 'अगले कदम'}
                </h5>
                <ul className="space-y-1">
                  {step.nextSteps.map((nextStep, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4 mt-0.5 text-green-500" />
                      <span>{nextStep}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                {i18n.language === 'en' ? 'Notes' : i18n.language === 'mr' ? 'टिप्पण्या' : 'नोट्स'}
              </h5>
              <div className="space-y-2">
                {step.notes && step.notes.map((note, i) => (
                  <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {note}
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={i18n.language === 'en' ? 'Add a note...' : i18n.language === 'mr' ? 'टीप जोडा...' : 'नोट जोड़ें...'}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={() => handleAddNote(step.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    {i18n.language === 'en' ? 'Add' : i18n.language === 'mr' ? 'जोडा' : 'जोड़ें'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {i18n.language === 'en' ? 'Application Timeline' : i18n.language === 'mr' ? 'अर्ज टाइमलाइन' : 'आवेदन टाइमलाइन'}
        </h3>
        <div className="space-y-4">
          {progress.timeline.map((event, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${
                event.type === 'success' ? 'bg-green-100 text-green-600' :
                event.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                event.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {event.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                 event.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                 event.type === 'error' ? <XSquare className="w-4 h-4" /> :
                 <Clock className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
