import { useCallback, useEffect, useRef, useState } from "react";

interface ViewportState {
	x: number;
	y: number;
}

export function useViewportDrag() {
	const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const isDraggingRef = useRef(false);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (e.button === 0) {
				// Solo clic izquierdo
				// Verificar si se hizo clic en un nodo
				const target = e.target as HTMLElement;
				const isNodeOrChild = target.closest(".skill-tree-node") !== null;

				// Solo iniciar arrastre si NO se hizo clic en un nodo o sus hijos
				if (!isNodeOrChild) {
					setIsDragging(true);
					isDraggingRef.current = true;
					setDragStart({
						x: e.clientX - viewport.x,
						y: e.clientY - viewport.y,
					});
					e.preventDefault();
				}
			}
		},
		[viewport.x, viewport.y],
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDraggingRef.current) return;

			e.preventDefault();
			e.stopPropagation(); // Evitar interferencia con otros eventos

			const newX = e.clientX - dragStart.x;
			const newY = e.clientY - dragStart.y;

			setViewport((prev) => ({
				...prev,
				x: newX,
				y: newY,
			}));
		},
		[dragStart.x, dragStart.y],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		isDraggingRef.current = false;
	}, []);

	// Agregar event listeners globales para mouse move y up
	useEffect(() => {
		if (isDragging) {
			// Usar passive: false para poder prevenir eventos
			document.addEventListener("mousemove", handleMouseMove, {
				passive: false,
			});
			document.addEventListener("mouseup", handleMouseUp);
			// También manejar cuando el mouse sale de la ventana
			document.addEventListener("mouseleave", handleMouseUp);

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				document.removeEventListener("mouseleave", handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	return {
		viewport,
		setViewport,
		isDragging,
		handleMouseDown,
	};
}
