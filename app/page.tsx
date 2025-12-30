import Image from "next/image"
import Header from "../components/layout/Header"
import Hero from "@/components/layout/Hero"
import Gallery from "@/components/layout/Gallery"
import Workflows from "@/components/layout/Workflows"
import WorkflowTransition from "@/components/layout/WorkflowTransition"
import ProfessionalTools from "@/components/layout/ProfessionalTools"
import ControlOutcome from "@/components/layout/ControlOutcome"
import AIModels from "@/components/layout/AIModels"
import Footer from "@/components/layout/Footer"
import Canvas from "@/components/workflows/Canvas"

// export default function Home() {
//   return (
//     <div style={{ height: '100%', width: '100%' }}>
//       {/* <Header />
//       <Hero />
//       <Gallery />
//       <WorkflowTransition />
//       <Workflows />
//       <ProfessionalTools />
//       <ControlOutcome />
//       <AIModels />
//       <Footer /> */}
//       <Canvas />
//     </div>
//   )
// }
import '@xyflow/react/dist/style.css'

export default function Home() {
  return (
    <Canvas />
  )
}