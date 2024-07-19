// Libraries
import { Outlet } from 'react-router-dom';

// Components
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      <main className='lg:min-h-[calc(100vh-100px)] sm:min-h-[calc(90vh-100px)] min-h-[calc(71vh-100px)]'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default App;
