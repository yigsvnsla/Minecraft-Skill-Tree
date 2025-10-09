import { useEffect, useState } from "react";
import {
	type NormalizedSkillNode,
	selectAllNodes,
	selectRootNodeId,
	selectUnlockedNodes,
} from "../features/skill-tree-slice";
import { useAppSelector } from ".";

export interface NodePosition {
	x: number;
	y: number;
	nodeId: string;
	unlocked: boolean;
	parentPos?: { x: number; y: number };
}

interface SkillTreeNode extends NormalizedSkillNode {
	children: SkillTreeNode[];
}

export function useSkillTreePositions() {
	const nodes = useAppSelector(selectAllNodes);
	const unlockedNodeIds = useAppSelector(selectUnlockedNodes);
	const rootNodeId = useAppSelector(selectRootNodeId);
	const [positions, setPositions] = useState<NodePosition[]>([]);

	useEffect(() => {
		if (!rootNodeId || Object.keys(nodes).length === 0) return;

		const buildTree = (nodeId: string): SkillTreeNode | null => {
			const node = nodes[nodeId];
			if (!node) return null;

			const children = Object.values(nodes)
				.filter((n) => n.parentId === nodeId)
				.map((child) => buildTree(child.id))
				.filter((child): child is SkillTreeNode => child !== null);

			return { ...node, children };
		};

		// Calculate positions for all nodes in the tree
		const calculatePositions = (
			node: SkillTreeNode,
			x: number,
			y: number,
			parentPos?: { x: number; y: number },
		): NodePosition[] => {
			const currentPos: NodePosition = {
				x,
				y,
				nodeId: node.id,
				unlocked: unlockedNodeIds.includes(node.id),
				parentPos,
			};

			if (!node.children || node.children.length === 0) {
				return [currentPos];
			}

			const childPositions: NodePosition[] = [];
			const verticalSpacing = 140;

			node.children.forEach((child: SkillTreeNode, index: number) => {
				const childY =
					y +
					index * verticalSpacing -
					((node.children.length - 1) * verticalSpacing) / 2;
				const childX = x + 120;
				childPositions.push(
					...calculatePositions(child, childX, childY, { x, y }),
				);
			});

			return [currentPos, ...childPositions];
		};

		const tree = buildTree(rootNodeId);
		if (tree) {
			const allPositions = calculatePositions(tree, 0, 0);
			setPositions(allPositions);
		}
	}, [nodes, unlockedNodeIds, rootNodeId]);

	// Calculate viewBox to fit all nodes with fallback values
	const minX =
		positions.length > 0 ? Math.min(...positions.map((p) => p.x)) - 50 : 0;
	const maxX =
		positions.length > 0 ? Math.max(...positions.map((p) => p.x)) + 150 : 1000;
	const minY =
		positions.length > 0 ? Math.min(...positions.map((p) => p.y)) - 50 : 0;
	const maxY =
		positions.length > 0 ? Math.max(...positions.map((p) => p.y)) + 100 : 800;

	const width = maxX - minX;
	const height = maxY - minY;

	return {
		positions,
		dimensions: {
			minX,
			maxX,
			minY,
			maxY,
			width,
			height,
		},
	};
}
