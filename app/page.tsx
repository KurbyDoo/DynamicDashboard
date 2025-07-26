export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Hero Section */}
        <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
          Syllabus Summarizer
        </h1>
        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
          Transform your course syllabi into dynamic, interactive dashboards with
          AI-powered insights
        </p>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
              📊
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Smart Analytics
            </h3>
            <p className="text-blue-100 text-sm">
              AI-powered analysis of your syllabus content with interactive charts
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-4 mx-auto">
              ⚡
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Quick Upload
            </h3>
            <p className="text-blue-100 text-sm">
              Drag and drop your syllabus files for instant processing
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg transform hover:scale-105 duration-200">
            Upload Syllabus
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            View Demo
          </button>
        </div>

        {/* Tailwind Test Elements */}
        <div className="mt-12 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-sm text-blue-200 mb-2">
            🧪 Tailwind CSS Test Elements:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs">
              Red
            </span>
            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs">
              Green
            </span>
            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs">
              Blue
            </span>
            <span className="px-3 py-1 bg-yellow-500 text-black rounded-full text-xs">
              Yellow
            </span>
            <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs">
              Purple
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
