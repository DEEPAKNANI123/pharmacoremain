import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, FileText, Loader2, User, Stethoscope } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import './RxValidation.css';

// DO NOT USE THIS IN A REAL PRODUCTION APP
// API keys in frontend bundles are compromised.
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface ParsedPrescription {
  patientName?: string;
  doctorDetails?: string;
  hospitalDetails?: string;
  medicines: {
    name: string;
    prescribedDoseTiming: string;
    conditionTreated: string;
    standardDose: string;
  }[];
}

export default function RxValidation() {
  const { rxQueue, users, updateRxStatus } = useDatabase();
  const [activeRxId, setActiveRxId] = useState<string | null>(null);
  const [base64Str, setBase64Str] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPrescription | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRx = rxQueue.find(rx => rx.id === activeRxId);
  const patientUser = users.find(u => u.id === selectedRx?.userId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBase64Str(base64String);
        setParsedData(null);
        setError(null);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!base64Str) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "You are an automated pharmacy assistant. Please analyze this image (either a prescription or a medicine strip) and return ONLY a valid JSON object. Extract 'doctorDetails' as a single string (e.g., 'Dr. Name - Speciality'), 'hospitalDetails' as a single string, and 'patientName' as a single string. Then extract an array of 'medicines'. For each medicine, provide: 'name', 'prescribedDoseTiming' (string: the dosage and timing instructed), 'conditionTreated' (string: which problem it solves generally), and 'standardDose' (string: the normal recommended dosage generally). If the image is just a medicine strip, extract the medicine details and leave doctor/hospital blank strings. Format: { \"patientName\": \"...\", \"doctorDetails\": \"...\", \"hospitalDetails\": \"...\", \"medicines\": [ { \"name\": \"...\", \"prescribedDoseTiming\": \"...\", \"conditionTreated\": \"...\", \"standardDose\": \"...\" } ] }"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Str
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image with OpenAI.');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      setParsedData(JSON.parse(content));
    } catch (err: any) {
      console.error(err);
      setError("Error analyzing image: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rx-container">
      <div className="dashboard-header mb-4">
        <h1>Pharmacist Queue (Online submissions)</h1>
        <p className="text-muted">Review and validate prescriptions submitted by patients via the mobile app.</p>
      </div>

      <div className="rx-queue-selector flex gap-2 mb-4 overflow-x-auto pb-2">
         {rxQueue.map(rx => {
            const user = users.find(u => u.id === rx.userId);
            return (
              <button 
                key={rx.id} 
                className={`panel rx-tab ${activeRxId === rx.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveRxId(rx.id);
                  setBase64Str(rx.imageUrl);
                  setParsedData(null);
                }}
                style={{ minWidth: '200px', cursor: 'pointer', border: activeRxId === rx.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}
              >
                <div className="flex-between">
                   <span className="text-xs font-bold">{user?.name || 'Unknown'}</span>
                   <span className={`status-badge status-${rx.status.toLowerCase()}`}>{rx.status}</span>
                </div>
                <p className="text-[10px] text-muted mt-1">{new Date(rx.date).toLocaleString()}</p>
              </button>
            )
         })}
         {rxQueue.length === 0 && <p className="text-muted p-4">Queue is empty. No patient submissions yet.</p>}
      </div>

      <style>{`
         .rx-tab.active { background: #eff6ff; }
         .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
         .status-reviewing { background: #fef3c7; color: #d97706; }
         .status-approved { background: #dcfce7; color: #166534; }
      `}</style>

      <div className="rx-grid">
        <div className="panel upload-panel">
          <h3 className="mb-4">Upload Prescription</h3>
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            {!base64Str ? (
              <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', height: '100%', padding: '2rem' }}>
                <UploadCloud size={48} className="text-primary opacity-70" />
                <p className="font-medium">Click to upload or drag & drop</p>
                <p className="text-sm text-muted">Supports JPG, PNG</p>
              </div>
            ) : (
              <img src={base64Str} alt="Prescription" className="uploaded-image" />
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            {base64Str && (
               <button className="btn btn-outline" onClick={() => { setBase64Str(null); setParsedData(null); }} style={{ flex: 1 }}>Clear</button>
            )}
            <button 
              className="btn btn-primary" 
              style={{ flex: 2 }} 
              onClick={handleAnalyze} 
              disabled={!base64Str || isLoading}
            >
              {isLoading ? <><Loader2 size={16} className="spinner" /> Analyzing...</> : 'Analyze with AI'}
            </button>
          </div>
          
          {error && <div className="text-danger mt-3 text-sm">{error}</div>}
        </div>

        <div className="panel results-panel" style={{ minHeight: '500px' }}>
          <h3 className="mb-4">Validation Output</h3>
          
          {isLoading && (
            <div className="flex-center" style={{ height: '400px', flexDirection: 'column', gap: '1.5rem' }}>
              <Loader2 size={64} className="text-primary spinner" />
              <div className="scanning-line"></div>
              <p className="text-primary font-medium processing-text" style={{ fontSize: '1.1rem' }}>GPT-4o is analyzing the image...</p>
              <p className="text-muted text-sm text-center px-4">Extracting doctor details, hospital details, medicines, dose timings, and evaluating condition & standard doses...</p>
            </div>
          )}

          {!isLoading && !parsedData && (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '1rem' }}>
              <FileText size={48} className="text-muted opacity-30" />
              <p className="text-muted text-sm px-4 text-center">Results will appear here after the AI successfully analyzes the uploaded document.</p>
            </div>
          )}

          {!isLoading && parsedData && (
            <div className="parsed-output">
               <div className="success-banner panel mb-4">
                  <CheckCircle size={20} className="text-success" />
                  <span>Validation Complete. Please verify extracted details.</span>
               </div>

               <div className="patient-box panel mb-4" style={{ backgroundColor: '#fafafa' }}>
                  <div className="flex-between mb-3">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} className="text-primary" />
                        <span className="font-medium">Patient:</span>
                     </div>
                     <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                       {typeof parsedData.patientName === 'object' ? JSON.stringify(parsedData.patientName) : parsedData.patientName || 'N/A'}
                     </span>
                  </div>
                  <div className="flex-between mb-2">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Stethoscope size={16} className="text-muted" />
                        <span className="font-medium text-muted">Doctor DETAILS:</span>
                     </div>
                     <span className="text-sm font-medium">
                       {typeof parsedData.doctorDetails === 'object' ? JSON.stringify(parsedData.doctorDetails) : parsedData.doctorDetails || 'N/A'}
                     </span>
                  </div>
                  <div className="flex-between">
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="font-medium text-muted" style={{ marginLeft: '1.5rem' }}>Hospital:</span>
                     </div>
                     <span className="text-sm">
                       {typeof parsedData.hospitalDetails === 'object' ? JSON.stringify(parsedData.hospitalDetails) : parsedData.hospitalDetails || 'N/A'}
                     </span>
                  </div>
               </div>

               <h4 className="mb-3">Prescribed Medications & Analysis</h4>
               <div className="medicines-analysis-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {parsedData.medicines && parsedData.medicines.map((med, idx) => (
                    <div key={idx} className="panel" style={{ padding: '1rem', border: '1px solid var(--color-primary-light)' }}>
                      <div className="flex-between mb-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>{med.name}</strong>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div>
                           <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Prescribed Dose & Timing</span>
                           <span className="font-medium">{med.prescribedDoseTiming || 'N/A'}</span>
                        </div>
                        <div>
                           <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Condition Treated</span>
                           <span className="font-medium text-info">{med.conditionTreated || 'N/A'}</span>
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)' }}>
                           <span className="text-muted d-block" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Standard Recommended Dose</span>
                           <span className="font-medium">{med.standardDose || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                 ))}
                 {(!parsedData.medicines || parsedData.medicines.length === 0) && (
                    <p className="text-center text-muted py-4">No medications detected.</p>
                 )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
