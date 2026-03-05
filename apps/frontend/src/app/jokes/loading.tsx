export default function JokesLoading(): JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center bg-orange-50">
            <div className="text-center">
                <div className="mx-auto mb-4 text-5xl animate-bounce">😂</div>
                <p className="text-lg font-semibold text-orange-700">Loading Jokes...</p>
            </div>
        </div>
    );
}
