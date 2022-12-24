import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './components/App';
import {Toaster} from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <>
    <App />
    <Toaster />
  </>,
);
