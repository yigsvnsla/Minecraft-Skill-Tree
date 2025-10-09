import { useCallback, useEffect, useRef, useState } from "react"
import {
  selectAllNodes,
  selectCanUnlockNode,
  selectRootNodeId,
  selectUnlockedNodes,
} from "../../features/skill-tree-slice"
import { useAppSelector } from "../../hooks"
import { SkillTreeNode } from "./skill-tree-node"

interface NodePosition {
  x: number
  y: number
  nodeId: string
  unlocked: boolean
  parentPos?: { x: number; y: number }
}

interface ViewportState {
  x: number
  y: number
}

export function SkillTree() {
  const nodes = useAppSelector(selectAllNodes)
  const unlockedNodeIds = useAppSelector(selectUnlockedNodes)
  const rootNodeId = useAppSelector(selectRootNodeId)

  const [positions, setPositions] = useState<NodePosition[]>([])
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false) // Referencia para evitar problemas de closure

  // Funciones para manejar el arrastre
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Solo clic izquierdo
      // Verificar si se hizo clic en un nodo
      const target = e.target as HTMLElement
      const isNodeOrChild = target.closest('.skill-tree-node') !== null

      // Solo iniciar arrastre si NO se hizo clic en un nodo o sus hijos
      if (!isNodeOrChild) {
        setIsDragging(true)
        isDraggingRef.current = true
        setDragStart({
          x: e.clientX - viewport.x,
          y: e.clientY - viewport.y
        })
        e.preventDefault()
      }
    }
  }, [viewport.x, viewport.y])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return

    e.preventDefault()
    e.stopPropagation() // Evitar interferencia con otros eventos

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    setViewport(prev => ({
      ...prev,
      x: newX,
      y: newY
    }))
  }, [dragStart.x, dragStart.y])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
  }, [])



  // Agregar event listeners globales para mouse move y up
  useEffect(() => {
    if (isDragging) {
      // Usar passive: false para poder prevenir eventos
      document.addEventListener('mousemove', handleMouseMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      // También manejar cuando el mouse sale de la ventana
      document.addEventListener('mouseleave', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('mouseleave', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])



  useEffect(() => {
    if (!rootNodeId || Object.keys(nodes).length === 0) return

    const buildTree = (nodeId: string): any => {
      const node = nodes[nodeId]
      if (!node) return null

      const children = Object.values(nodes)
        .filter((n) => n.parentId === nodeId)
        .map((child) => buildTree(child.id))
        .filter(Boolean)

      return { ...node, children }
    }

    // Calculate positions for all nodes in the tree
    const calculatePositions = (
      node: any,
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
      }

      if (!node.children || node.children.length === 0) {
        return [currentPos]
      }

      const childPositions: NodePosition[] = []
      const verticalSpacing = 140

      node.children.forEach((child: any, index: number) => {
        const childY = y + index * verticalSpacing - ((node.children.length - 1) * verticalSpacing) / 2
        const childX = x + 120
        childPositions.push(...calculatePositions(child, childX, childY, { x, y }))
      })

      return [currentPos, ...childPositions]
    }

    const tree = buildTree(rootNodeId)
    if (tree) {
      const allPositions = calculatePositions(tree, 0, 0)
      setPositions(allPositions)
    }
  }, [nodes, unlockedNodeIds, rootNodeId])

  // Calculate viewBox to fit all nodes with fallback values
  const minX = positions.length > 0 ? Math.min(...positions.map((p) => p.x)) - 50 : 0
  const maxX = positions.length > 0 ? Math.max(...positions.map((p) => p.x)) + 150 : 1000
  const minY = positions.length > 0 ? Math.min(...positions.map((p) => p.y)) - 50 : 0
  const maxY = positions.length > 0 ? Math.max(...positions.map((p) => p.y)) + 100 : 800

  const width = maxX - minX
  const height = maxY - minY

  // Centrar el contenido inicialmente si no se ha movido
  useEffect(() => {
    if (containerRef.current && viewport.x === 0 && viewport.y === 0 && positions.length > 0) {
      const rect = containerRef.current.getBoundingClientRect()
      setViewport(prev => ({
        ...prev,
        x: rect.width / 2 - width / 2, // Centrar el skill tree
        y: rect.height / 2 - height / 2,
      }))
    }
  }, [positions.length, viewport.x, viewport.y, width, height])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none', // Evitar selección de texto durante el arrastre
        backgroundImage: 'url(/stone.webp)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      role="application"
    >
      <div
        className="relative"
        style={{
          width,
          height,
          minWidth: "100%",
          minHeight: "100%",
          transform: `translate(${viewport.x}px, ${viewport.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG for connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width,
            height,
          }}
        >
          <title>{"Minecraft Skill Tree"}</title>
          {positions.map((pos, index) => {
            if (!pos.parentPos) return null

            return (
              <g key={`line-${index + 1}-${pos.nodeId}`}>
                {/* Connection path - Border */}
                <path
                  d={`M ${pos.parentPos.x - minX + 20} ${pos.parentPos.y - minY + 32} 
                      L ${pos.x - minX - 20} ${pos.parentPos.y - minY + 32} 
                      L ${pos.x - minX - 20} ${pos.y - minY + 32} 
                      L ${pos.x - minX} ${pos.y - minY + 32}`}
                  stroke="#000000"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="transition-all duration-500"
                />
                {/* Connection path - White fill */}
                <path
                  d={`M ${pos.parentPos.x - minX + 20} ${pos.parentPos.y - minY + 32} 
                      L ${pos.x - minX - 20} ${pos.parentPos.y - minY + 32} 
                      L ${pos.x - minX - 20} ${pos.y - minY + 32} 
                      L ${pos.x - minX} ${pos.y - minY + 32}`}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="transition-all duration-500"
                />
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {positions.map((pos, _index) => {
          const node = nodes[pos.nodeId]
          if (!node) return null

          return (
            <div
              key={pos.nodeId}
              className={`absolute skill-tree-node ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
              style={{
                left: pos.x - minX,
                top: pos.y - minY,
              }}
            >
              <SkillTreeNodeWithCanUnlock node={node} unlocked={pos.unlocked} nodeId={pos.nodeId} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkillTreeNodeWithCanUnlock({ node, unlocked, nodeId }: { node: any; unlocked: boolean; nodeId: string }) {
  const canUnlock = useAppSelector((state) => selectCanUnlockNode(state, nodeId))
  return <SkillTreeNode node={node} unlocked={unlocked} nodeId={nodeId} canUnlock={canUnlock} />
}
