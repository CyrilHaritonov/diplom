import type React from "react"
import { Box } from "@mui/material"

const AnimatedBackground: React.FC = () => {
  const getRandomRotation = () => Math.floor(Math.random() * 360); // Random rotation between 0 and 360 degrees
  const getRandomSize = () => Math.floor(Math.random() * 50) + 30; // Random size between 30 and 80

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "linear-gradient(45deg, #f0f4f8 0%, #fff 100%)",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 2000 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>
            {`
              @keyframes float1 {
                0% { transform: translate(0, 0) rotate(0deg); }
                100% { transform: translate(50px, 30px) rotate(60deg); }
              }
              @keyframes float2 {
                0% { transform: translate(0, 0) rotate(0deg); }
                100% { transform: translate(-30px, 40px) rotate(-40deg); }
              }
              @keyframes float3 {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(25px, -25px) scale(1.05); }
                100% { transform: translate(0, 0) scale(1); }
              }
              @keyframes float4 {
                0% { transform: translate(0, 0) rotate(0deg); }
                100% { transform: translate(20px, -20px) rotate(20deg); }
              }
              .shape1 { animation: float1 25s infinite alternate ease-in-out; }
              .shape2 { animation: float2 20s infinite alternate ease-in-out; }
              .shape3 { animation: float3 22s infinite ease-in-out; }
              .shape4 { animation: float4 18s infinite alternate ease-in-out; }
            `}
          </style>
        </defs>
        <circle cx="200" cy="200" r="180" fill="#e0f2fe" className="shape1" opacity="0.5" />
        <rect x="1600" y="400" width="300" height="300" fill="#bae6fd" className="shape2" opacity="0.2" />
        <polygon points="1000,100 1200,400 800,400" fill="#7dd3fc" className="shape3" opacity="0.1" />
        <circle cx="1800" cy="900" r="120" fill="#e0f2fe" className="shape1" opacity="0.5" />
        <rect x="100" y="700" width="250" height="250" fill="#bae6fd" className="shape2" opacity="0.2" />
        <polygon points="600,800 750,950 450,950" fill="#7dd3fc" className="shape3" opacity="0.2" />
        <circle cx="1200" cy="300" r="100" fill="#e0f2fe" className="shape4" opacity="0.4" />
        <rect x="400" y="200" width="150" height="150" fill="#bae6fd" className="shape1" opacity="0.25" />
        <polygon points="1600,600 1700,750 1500,750" fill="#7dd3fc" className="shape2" opacity="0.2" />
        <circle cx="300" cy="800" r="80" fill="#e0f2fe" className="shape3" opacity="0.35" />
        <rect x="1400" y="100" width="200" height="200" fill="#bae6fd" className="shape4" opacity="0.25" />
        <polygon points="800,500 900,600 700,600" fill="#7dd3fc" className="shape1" opacity="0.25" />
        <circle cx="1700" cy="200" r="90" fill="#e0f2fe" className="shape2" opacity="0.25" />
        <rect x="500" y="600" width="180" height="180" fill="#bae6fd" className="shape3" opacity="0.25" />
        <polygon points="1300,800 1400,900 1200,900" fill="#7dd3fc" className="shape4" opacity="0.25" />
      </svg>
    </Box>
  )
}

export default AnimatedBackground

