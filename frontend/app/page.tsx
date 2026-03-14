export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
        Welcome to Delta EE
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Master complex electrical engineering concepts through spaced repetition and bite-sized micro-lessons.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Continue Learning</h2>
          <p className="text-gray-500 mb-4">You have 3 reviews due today.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Start Review
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Explore Tracks</h2>
          <p className="text-gray-500 mb-4">Dive into VLSI, Power Electronics, and more.</p>
          <button className="bg-gray-100 text-blue-600 px-4 py-2 rounded border border-gray-300 hover:bg-gray-200 transition">
            Browse Modules
          </button>
        </div>
      </div>
    </div>
  );
}