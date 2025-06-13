import { createHashRouter } from "react-router-dom"

import { Layout } from "@/components/Layout"
import WelcomePage from "@/pages/welcome"
import ManagementPage from "@/pages/management"

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
    ]
  }
])