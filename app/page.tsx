// "use client";

// import dynamic from 'next/dynamic';

// // 1. We dynamically import the component and explicitly disable SSR
// const CameraPlayer = dynamic(() => import('@/components/LiveStream'), { 
//   ssr: false,
//   loading: () => <div className="w-full aspect-video bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">Loading Player...</div>
// });

// export default function Dashboard() {
//   const cameras = [
//     { id: 'camera1', title: 'Camera 1 (4G)' },
//     { id: 'camera2', title: 'Camera 2 (4G)' },
//     { id: 'camera3', title: 'Fortune Office (IP Camera 1)' },
//     { id: 'camera4', title: 'Fortune Office (IP Camera 2)' },
//     { id: 'camera6', title: 'Fortune Office (IP Camera 3)' },
//     { id: 'camera7', title: 'Fortune Office (IP Camera 4)' },
//     { id: 'camera8', title: 'Fortune Office (IP Camera 5)' },
//     { id: 'camera9', title: 'Fortune Office (IP Camera 6)' },
//     { id: 'camera10', title: 'Fortune Office (IP Camera 7)' },
//   ];

//   return (
//     <main className="min-h-screen bg-slate-950 p-6 md:p-8">
//       <div className="max-w-7xl mx-auto">
        
//         <header className="mb-8 flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight text-white">
//               Security Dashboard
//             </h1>
//             <p className="text-sm text-slate-400 mt-1">
//               Ultra-low latency WebSocket feeds
//             </p>
//           </div>
//         </header>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {cameras.map((cam) => (
//             // 2. Use the dynamically imported component here
//             <CameraPlayer 
//               key={cam.id} 
//               cameraId={cam.id} 
//               title={cam.title} 
//             />
//           ))}
//         </div>

//       </div>
//     </main>
//   );
// }

"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const CameraPlayer = dynamic(() => import("@/components/LiveStream"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-slate-900 rounded-xl animate-pulse flex items-center justify-center text-slate-500">
      Loading Player...
    </div>
  ),
});

export default function Dashboard() {

  const cameras = [
    { id: "camera1", title: "Camera 1 ()" },
    { id: "camera2", title: "Camera 2 ()" },
    { id: "camera3", title: "Fortune Office (IP Camera 203)" },
    { id: "camera4", title: "Fortune Office (IP Camera 204)" },
    { id: "camera5", title: "Fortune Office (IP Camera 205)" },
    { id: "camera6", title: "Fortune Office (IP Camera 206)" },
    { id: "camera7", title: "Fortune Office (IP Camera 207)" },
    { id: "camera8", title: "Fortune Office (IP Camera 208)" },
    { id: "camera9", title: "Fortune Office (IP Camera 209)" },
    { id: "camera10", title: "Fortune Office (IP Camera 210)" },
    { id: "camera11", title: "Fortune Office (IP Camera 211)" },
    { id: "camera12", title: "Fortune Office (IP Camera 212)" },
    { id: "camera13", title: "Fortune Office (IP Camera 213)" },
    { id: "camera14", title: "Fortune Office (IP Camera 214)" },
    { id: "camera15", title: "Fortune Office (IP Camera 215)" },
    { id: "camera16", title: "Fortune Office (IP Camera 216)" },
    { id: "camera17", title: "Fortune Office (IP Camera 217)" },
    { id: "camera18", title: "Fortune Office (IP Camera 218)" },
    { id: "camera19", title: "Fortune Office (IP Camera 219)" },
    { id: "camera20", title: "Fortune Office (IP Camera 220)" },
    { id: "camera21", title: "Fortune Office (IP Camera 221)" },
    { id: "camera22", title: "Fortune Office (IP Camera 222)" },
    { id: "camera23", title: "Fortune Office (IP Camera 223)" },
    { id: "camera24", title: "Fortune Office (IP Camera 224)" },
    { id: "camera25", title: "Fortune Office (IP Camera 225)" },
    { id: "camera26", title: "Fortune Office (IP Camera 226)" },
    { id: "camera27", title: "Fortune Office (IP Camera 227)" },
    { id: "camera28", title: "Fortune Office (IP Camera 228)" },
    { id: "camera29", title: "Fortune Office (IP Camera 229)" },
    { id: "camera30", title: "Fortune Office (IP Camera 230)" },
    { id: "camera31", title: "Fortune Office (IP Camera 231)" },
    { id: "camera32", title: "Fortune Office (IP Camera 232)" },
    { id: "camera33", title: "Fortune Office (IP Camera 233)" },
    { id: "camera34", title: "Fortune Office (IP Camera 234)" },
    { id: "camera35", title: "Fortune Office (IP Camera 235)" },
    { id: "camera36", title: "Fortune Office (IP Camera 236)" },
    { id: "camera37", title: "Fortune Office (IP Camera 240)" },
    { id: "camera38", title: "Fortune Office (IP Camera 242)" },
    { id: "camera39", title: "Fortune Office (IP Camera 243)" },
    { id: "camera40", title: "Fortune Office (IP Camera 244)" },
    { id: "camera41", title: "Fortune Office (IP Camera 245)" },
    { id: "camera42", title: "Fortune Office (IP Camera 246)" },
    { id: "camera43", title: "Fortune Office (IP Camera 247)" },
    { id: "camera44", title: "Fortune Office (IP Camera 248)" },
    { id: "camera45", title: "Fortune Office (IP Camera 249)" },
    { id: "camera46", title: "Fortune Office (IP Camera 250)" },
  ];

  const CAMERAS_PER_PAGE = 8;

  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(cameras.length / CAMERAS_PER_PAGE);

  const startIndex = (page - 1) * CAMERAS_PER_PAGE;

  const visibleCameras = cameras.slice(
    startIndex,
    startIndex + CAMERAS_PER_PAGE
  );

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Security Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Ultra-low latency WebSocket feeds
            </p>
          </div>
        </header>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {visibleCameras.map((cam) => (
            <CameraPlayer
              key={cam.id}
              cameraId={cam.id}
              title={cam.title}
            />
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-4 mt-10">

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Prev
          </button>

          <span className="text-slate-300 text-sm">
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Next
          </button>

        </div>
      </div>
    </main>
  );
}