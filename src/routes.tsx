import { createHashRouter } from "react-router-dom"

import { Layout } from "@/components/Layout"
import WelcomePage from "@/pages/welcome"
import ManagementPage from "@/pages/management"
import ManagementPidPage from "./pages/management-pid"

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <WelcomePage />
      },
      {
        path: "management",
        element: <ManagementPage />
      },
      {
        path: "management-pid",
        element: <ManagementPidPage />
      },
    ]
  }
])