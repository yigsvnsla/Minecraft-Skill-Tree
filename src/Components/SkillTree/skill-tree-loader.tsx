"use client";

import { useEffect, useState } from "react";
import { loadSkillTree } from "../../features/skill-tree-slice";
import { useAppDispatch } from "../../hooks";
import { SkillTree } from "./skill-tree";

interface NestedSkillNode {
	name: string;
	description: string;
	image: string;
	children: NestedSkillNode[];
}

interface SkillTreeLoaderProps {
	data: NestedSkillNode;
}

export function SkillTreeLoader({ data: defaultData }: SkillTreeLoaderProps) {
	const dispatch = useAppDispatch();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				// Obtener URL desde query params
				const urlParams = new URLSearchParams(window.location.search);
				const dataUrl = urlParams.get("dataUrl");
        // deberia usar React Query Lo se
				if (dataUrl) {
					setIsLoading(true);
					setError(null);

					// Cargar datos desde la URL
					const response = await fetch(dataUrl);

					if (!response.ok) {
						throw new Error(
							`Error al cargar datos: ${response.status} ${response.statusText}`,
						);
					}

					const jsonData = await response.json();
					dispatch(loadSkillTree(jsonData));
					setIsLoading(false);
				} else {
					// Usar datos por defecto
					dispatch(loadSkillTree(defaultData));
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Error desconocido al cargar los datos",
				);
				setIsLoading(false);
				// En caso de error, cargar datos por defecto
				dispatch(loadSkillTree(defaultData));
			}
		};

		loadData();
	}, [dispatch, defaultData]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-white font-minecraft text-xl">Cargando datos...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<p className="text-red-500 font-minecraft text-lg">⚠️ {error}</p>
				<p className="text-white font-minecraft text-sm">
					Usando datos por defecto
				</p>
			</div>
		);
	}

	return <SkillTree />;
}
