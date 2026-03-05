export default function QuizLoading(): JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
            <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <p className="text-lg font-semibold text-white">Loading Quiz...</p>
            </div>
        </div>
    );
}
