import { useEffect } from "react";

export function useBackgroundMusic() {
	useEffect(() => {
		const audio = new Audio("/ots.mp3");
		audio.loop = true;
		audio.volume = 0.4;

		const startMusic = () => {
			audio
				.play()
				.then(() => console.log("✅ Reproduciendo"))
				.catch((err) => console.error("❌ Error al reproducir:", err));
			window.removeEventListener("click", startMusic);
		};

		window.addEventListener("click", startMusic);

		return () => {
			audio.pause();
			window.removeEventListener("click", startMusic);
		};
	}, []);
}
