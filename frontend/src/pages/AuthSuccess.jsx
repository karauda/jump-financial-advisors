import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthSuccess({ onSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hubspotConnected = searchParams.get('hubspot') === 'true';

  useEffect(() => {
    const timer = setTimeout(async () => {
      await onSuccess();
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, onSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {hubspotConnected ? 'HubSpot Connected!' : 'Successfully Authenticated!'}
        </h1>
        <p className="text-gray-600 mb-4">
          Redirecting you to the app...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
