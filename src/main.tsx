import { createRoot } from 'react-dom/client'
import './index.css'
import './fonts/zcool-kuaile.css' // ZCOOL KuaiLe with size-adjust (see that file)
import Journal from './components/Journal'

createRoot(document.getElementById('root')!).render(<Journal />)
