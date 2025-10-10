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

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			// Verificar si se hizo clic en un nodo
			const target = e.target as HTMLElement;
			const isNodeOrChild = target.closest(".skill-tree-node") !== null;

			// Solo iniciar arrastre si NO se hizo clic en un nodo o sus hijos
			if (!isNodeOrChild && e.touches.length === 1) {
				const touch = e.touches[0];
				setIsDragging(true);
				isDraggingRef.current = true;
				setDragStart({
					x: touch.clientX - viewport.x,
					y: touch.clientY - viewport.y,
				});
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

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			if (!isDraggingRef.current || e.touches.length !== 1) return;

			e.preventDefault();
			e.stopPropagation();

			const touch = e.touches[0];
			const newX = touch.clientX - dragStart.x;
			const newY = touch.clientY - dragStart.y;

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

	const handleTouchEnd = useCallback(() => {
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

			// Agregar event listeners para touch
			document.addEventListener("touchmove", handleTouchMove, {
				passive: false,
			});
			document.addEventListener("touchend", handleTouchEnd);
			document.addEventListener("touchcancel", handleTouchEnd);

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
				document.removeEventListener("mouseleave", handleMouseUp);
				document.removeEventListener("touchmove", handleTouchMove);
				document.removeEventListener("touchend", handleTouchEnd);
				document.removeEventListener("touchcancel", handleTouchEnd);
			};
		}
	}, [
		isDragging,
		handleMouseMove,
		handleMouseUp,
		handleTouchMove,
		handleTouchEnd,
	]);

	return {
		viewport,
		setViewport,
		isDragging,
		handleMouseDown,
		handleTouchStart,
	};
}
