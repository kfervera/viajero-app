import { Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'
import { Actividades } from './routes/TripDetail/Actividades'
import { Estadia } from './routes/TripDetail/Estadia'
import { Horario } from './routes/TripDetail/Horario'
import { Principal } from './routes/TripDetail/Principal'
import { TripDetail } from './routes/TripDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/viajes/nuevo" element={<TripDetail />}>
        <Route index element={<Principal />} />
      </Route>
      <Route path="/viajes/:tripId" element={<TripDetail />}>
        <Route index element={<Actividades />} />
        <Route path="principal" element={<Principal />} />
        <Route path="estadia" element={<Estadia />} />
        <Route path="horario" element={<Horario />} />
      </Route>
    </Routes>
  )
}

export default App
