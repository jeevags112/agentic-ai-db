import React, { useState, useEffect, useRef } from "react";
import { Entity, Relationship } from "../types";
import { Database, Key, Link, Minimize2, Maximize2, Move, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface ErDiagramProps {
  entities: Entity[];
  relationships: Relationship[];
}

interface TablePosition {
  [tableName: string]: { x: number; y: number };
}

export default function ErDiagram({ entities, relationships }: ErDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<TablePosition>({});
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredRelationship, setHoveredRelationship] = useState<Relationship | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Initialize table positions in a nice grid/circle layout on load or when entities change
  useEffect(() => {
    if (!entities || entities.length === 0) return;
    
    const newPositions: TablePosition = {};
    const cols = Math.ceil(Math.sqrt(entities.length));
    const spacingX = 320;
    const spacingY = 240;

    entities.forEach((entity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newPositions[entity.tableName] = {
        x: 50 + col * spacingX,
        y: 40 + row * spacingY,
      };
    });

    setPositions(newPositions);
  }, [entities]);

  // Mouse drag handlers for table movement
  const handleMouseDown = (tableName: string, e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
    const pos = positions[tableName];
    if (!pos) return;
    
    // Calculate client mouse offset
    setDraggingTable(tableName);
    setDragOffset({
      x: e.clientX / zoom - pos.x,
      y: e.clientY / zoom - pos.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Boundary constraints
    const rect = container.getBoundingClientRect();
    const newX = Math.max(10, Math.min(2000, e.clientX / zoom - dragOffset.x));
    const newY = Math.max(10, Math.min(2000, e.clientY / zoom - dragOffset.y));

    setPositions((prev) => ({
      ...prev,
      [draggingTable]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    setDraggingTable(null);
  };

  // Helper to calculate elegant curved lines between tables
  const getBezierPath = (fromName: string, toName: string) => {
    const fromPos = positions[fromName];
    const toPos = positions[toName];
    
    if (!fromPos || !toPos) return "";

    // Approximate table dimensions (width: 250px, dynamic height)
    const tableWidth = 240;
    const tableHeight = 150;

    // Determine exit/entry sides based on relative position
    let startX = fromPos.x + tableWidth / 2;
    let startY = fromPos.y + tableHeight / 2;
    let endX = toPos.x + tableWidth / 2;
    let endY = toPos.y + tableHeight / 2;

    if (fromPos.x + tableWidth < toPos.x) {
      // From right to left
      startX = fromPos.x + tableWidth;
      endX = toPos.x;
    } else if (toPos.x + tableWidth < fromPos.x) {
      // From left to right
      startX = fromPos.x;
      endX = toPos.x + tableWidth;
    }

    if (fromPos.y + tableHeight < toPos.y) {
      // From bottom to top
      startY = fromPos.y + tableHeight;
      endY = toPos.y;
    } else if (toPos.y + tableHeight < fromPos.y) {
      // From top to bottom
      startY = fromPos.y;
      endY = toPos.y + tableHeight;
    }

    const controlOffsetX = Math.abs(endX - startX) * 0.5;
    const cp1x = startX + (endX > startX ? controlOffsetX : -controlOffsetX);
    const cp1y = startY;
    const cp2x = endX + (endX > startX ? -controlOffsetX : controlOffsetX);
    const cp2y = endY;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  };

  const isRelActive = (rel: Relationship) => {
    if (!hoveredRelationship) return false;
    return (
      (rel.fromTable === hoveredRelationship.fromTable && rel.toTable === hoveredRelationship.toTable) ||
      (rel.fromTable === hoveredRelationship.toTable && rel.toTable === hoveredRelationship.fromTable)
    );
  };

  const zoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
  const zoomOut = () => setZoom(prev => Math.max(0.6, prev - 0.1));
  const resetZoom = () => setZoom(1);

  return (
    <div id="er-canvas-wrapper" className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
      {/* ER Controller bar */}
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-display">
            Interactive Schema ER Visualizer
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Zoom Out"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-400 w-12 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={zoomIn}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Zoom In"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={resetZoom}
            className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Map Drag Guide */}
      <div className="absolute top-12 left-4 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 flex items-center space-x-2 pointer-events-none z-10">
        <Move className="w-3.5 h-3.5 text-indigo-400" />
        <span>Drag table headers to rearrange connections</span>
      </div>

      {/* Main interactive canvas area */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing p-10 min-h-[500px]"
        style={{ backgroundImage: "radial-gradient(#334155 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      >
        <div 
          className="absolute inset-0 origin-top-left transition-transform duration-75"
          style={{ transform: `scale(${zoom})`, width: "2500px", height: "2000px" }}
        >
          {/* SVG Relationship Connector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
              </marker>
            </defs>

            {relationships.map((rel, index) => {
              const active = isRelActive(rel);
              const path = getBezierPath(rel.fromTable, rel.toTable);
              
              if (!path) return null;

              return (
                <g key={`rel-group-${index}`}>
                  {/* Outer thicker helper for easier hover target */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    className="cursor-pointer pointer-events-auto"
                    onMouseEnter={() => setHoveredRelationship(rel)}
                    onMouseLeave={() => setHoveredRelationship(null)}
                  />
                  {/* Visual connector line */}
                  <path
                    d={path}
                    fill="none"
                    stroke={active ? "#fbbf24" : "#4f46e5"}
                    strokeWidth={active ? "2.5" : "1.5"}
                    strokeDasharray={rel.cardinality === "N:M" ? "4 4" : "0"}
                    markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
                    className="transition-colors duration-150"
                  />
                  {/* Cardinality badge text */}
                  {active && positions[rel.fromTable] && positions[rel.toTable] && (
                    <foreignObject
                      x={(positions[rel.fromTable].x + positions[rel.toTable].x) / 2 + 30}
                      y={(positions[rel.fromTable].y + positions[rel.toTable].y) / 2 - 10}
                      width="80"
                      height="30"
                    >
                      <div className="bg-amber-500 text-slate-950 font-mono text-[9px] font-bold px-1 py-0.5 rounded shadow flex items-center justify-center space-x-1 border border-amber-400">
                        <Link className="w-2.5 h-2.5" />
                        <span>{rel.cardinality}</span>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Table Cards */}
          {entities.map((entity) => {
            const pos = positions[entity.tableName] || { x: 50, y: 50 };
            const isHovered = hoveredTable === entity.tableName;
            
            // Check if this table has any active relations currently hovered
            const hasActiveRelation = hoveredRelationship && 
              (hoveredRelationship.fromTable === entity.tableName || hoveredRelationship.toTable === entity.tableName);

            return (
              <div
                key={entity.tableName}
                className={`absolute w-60 rounded-xl bg-slate-900/95 border text-xs shadow-2xl transition-all duration-150 z-10 select-none ${
                  isHovered || hasActiveRelation
                    ? "border-indigo-400 ring-2 ring-indigo-500/10 shadow-indigo-500/10"
                    : "border-slate-800"
                }`}
                style={{
                  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                  willChange: "transform",
                }}
                onMouseEnter={() => setHoveredTable(entity.tableName)}
                onMouseLeave={() => setHoveredTable(null)}
              >
                {/* Header (Drag anchor) */}
                <div
                  onMouseDown={(e) => handleMouseDown(entity.tableName, e)}
                  className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 rounded-t-xl flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-slate-950"
                >
                  <div className="flex items-center space-x-1.5 overflow-hidden">
                    <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-bold text-slate-200 truncate font-mono">
                      {entity.tableName}
                    </span>
                  </div>
                  <span title={entity.description}>
                    <HelpCircle 
                      className="w-3 h-3 text-slate-500 hover:text-slate-300 cursor-pointer shrink-0"
                    />
                  </span>
                </div>

                {/* Columns List */}
                <div className="p-1.5 space-y-0.5 bg-slate-900/40">
                  {entity.columns.map((col) => (
                    <div
                      key={col.name}
                      className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                        col.isPrimaryKey 
                          ? "bg-indigo-950/20 text-indigo-300" 
                          : col.isForeignKey 
                          ? "bg-amber-950/10 text-amber-300" 
                          : "hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 overflow-hidden">
                        {col.isPrimaryKey ? (
                          <span title="Primary Key">
                            <Key className="w-3 h-3 text-indigo-400 shrink-0" />
                          </span>
                        ) : col.isForeignKey ? (
                          <span title={`Foreign Key: references ${col.referencesTable}(${col.referencesColumn})`}>
                            <Link className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        ) : (
                          <span className="w-3 h-3 shrink-0" />
                        )}
                        <span className={`font-mono truncate ${col.isPrimaryKey ? "font-semibold" : ""}`}>
                          {col.name}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0">
                        {col.dataType}
                        {col.isNullable ? "?" : ""}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Table Footer description snippet */}
                {entity.description && (
                  <div className="px-3 py-1.5 bg-slate-950/30 border-t border-slate-800/40 text-[10px] text-slate-500 italic truncate rounded-b-xl">
                    {entity.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
