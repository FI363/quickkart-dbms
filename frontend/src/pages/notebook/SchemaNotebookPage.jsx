/**
 * QuickKart DBMS — Interactive Schema Notebook Sketch View
 * Inspired by Apple Notes / Apple Freeform Sketch Canvas
 * Features:
 *  - Infinite Pan & Cursor-Centered Zoom Canvas (15% to 250%)
 *  - All 23 Project Tables across 8 Domains Smart-Arranged & Connected with Precision Column-to-Column Lines
 *  - 4 Smart Auto-Layout Algorithms (Domain Clusters, Tiered DAG Flow, Hub Constellation, Sequential DDL Grid)
 *  - 1:1 Direct Manipulation Table Dragging + Freehand Apple Pencil Ink, Highlighter & Sticky Notes
 *  - 4 Notebook Paper Textures (Warm Dot-Grid, Ruled Legal Pad, Engineering Graph, Midnight Blueprint)
 *  - Interactive Mini-Map, Relationship Constraint Inspector, Live Table Data & SQL DDL Drawer
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    SCHEMA_DOMAINS,
    SCHEMA_TABLES,
    SCHEMA_RELATIONSHIPS,
    INITIAL_STICKY_NOTES
} from '../../data/schemaNotebookData';
import {
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCcw,
    Sparkles,
    Search,
    MousePointer,
    Hand,
    PenTool,
    Highlighter,
    StickyNote,
    Eraser,
    Trash2,
    Key,
    Link2,
    Database,
    Layers,
    Eye,
    EyeOff,
    Code2,
    Table2,
    ShieldCheck,
    Workflow,
    Copy,
    Check,
    X,
    ChevronRight,
    Compass,
    Grid,
    FileText,
    GitCommit
} from 'lucide-react';

// ============================================================================
// GEOMETRY CONSTANTS FOR EXACT COLUMN-TO-COLUMN LINE ROUTING
// ============================================================================
const CARD_WIDTH = 288;
const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 26;
const FOOTER_HEIGHT = 28;

function getVisibleColumns(table, onlyKeys) {
    if (!onlyKeys) return table.columns;
    return table.columns.filter(c => c.isPK || c.isFK || c.isUnique);
}

function getCardHeight(table, onlyKeys = false) {
    const cols = getVisibleColumns(table, onlyKeys);
    return HEADER_HEIGHT + cols.length * ROW_HEIGHT + FOOTER_HEIGHT;
}

// ============================================================================
// SMART AUTO-ARRANGEMENT ENGINE (4 ALGORITHMS)
// ============================================================================
function computeSmartLayout(mode, onlyKeys = false) {
    const positions = {};
    const tableMap = Object.fromEntries(SCHEMA_TABLES.map(t => [t.id, t]));

    if (mode === 'domain') {
        // 4-Column Topological Domain Architecture:
        // Col 0: Domain A (Identity) + Domain G (Delivery Fleet)
        // Col 1: Domain D (Carts & Orders) + Domain F (Payments & Refunds)
        // Col 2: Domain E (Stock Reservations) + Domain C (Dark Stores & Inventory) + Domain H (Transfers)
        // Col 3: Domain B (Product Catalogue & SKUs)
        const columnsSpec = [
            {
                x: 110,
                groups: [
                    { domain: 'A', tables: ['roles', 'users', 'addresses'] },
                    { domain: 'G', tables: ['delivery_partners', 'deliveries', 'delivery_status_history'] }
                ]
            },
            {
                x: 560,
                groups: [
                    { domain: 'D', tables: ['carts', 'cart_items', 'orders', 'order_items', 'order_status_history'] },
                    { domain: 'F', tables: ['payments', 'refunds'] }
                ]
            },
            {
                x: 1010,
                groups: [
                    { domain: 'E', tables: ['stock_reservations'] },
                    { domain: 'C', tables: ['dark_stores', 'store_inventory', 'inventory_transactions'] },
                    { domain: 'H', tables: ['stock_transfers', 'stock_transfer_items'] }
                ]
            },
            {
                x: 1460,
                groups: [
                    { domain: 'B', tables: ['categories', 'brands', 'products', 'product_variants'] }
                ]
            }
        ];

        columnsSpec.forEach((col, colIdx) => {
            let currentY = 175;
            col.groups.forEach((grp) => {
                grp.tables.forEach((tableId, idxInGrp) => {
                    const t = tableMap[tableId];
                    if (!t) return;
                    // Subtle horizontal stagger inside column so same-column vertical FKs have clean routing lanes
                    const staggerX = (idxInGrp % 2 === 1) ? 28 : 0;
                    positions[tableId] = { x: col.x + staggerX, y: currentY };
                    currentY += getCardHeight(t, onlyKeys) + 38;
                });
                currentY += 68; // Extra breathing room between domain frames
            });
        });
    } else if (mode === 'hierarchy') {
        // Strict Left-to-Right Dependency DAG (Tier 0 -> Tier 5)
        const tiers = [0, 1, 2, 3, 4, 5];
        const colSpacing = 395;
        const startX = 100;

        // First compute total height per tier so we can vertically center each tier
        const tierHeights = tiers.map(tier => {
            const list = SCHEMA_TABLES.filter(t => t.tier === tier);
            return list.reduce((sum, t) => sum + getCardHeight(t, onlyKeys) + 36, 0);
        });
        const maxTierHeight = Math.max(...tierHeights, 1200);

        tiers.forEach((tier, tIdx) => {
            const list = SCHEMA_TABLES.filter(t => t.tier === tier);
            const totalH = tierHeights[tIdx];
            let currentY = 150 + Math.max(0, (maxTierHeight - totalH) / 2);

            list.forEach(t => {
                positions[t.id] = { x: startX + tIdx * colSpacing, y: Math.round(currentY) };
                currentY += getCardHeight(t, onlyKeys) + 36;
            });
        });
    } else if (mode === 'radial') {
        // Hub & Spoke Constellation: Core hubs in inner ring, satellites in outer ring
        const centerX = 1080;
        const centerY = 980;
        const hubs = [
            { id: 'users', x: centerX - 380, y: centerY - 340 },
            { id: 'orders', x: centerX - 380, y: centerY + 120 },
            { id: 'dark_stores', x: centerX + 120, y: centerY - 340 },
            { id: 'product_variants', x: centerX + 120, y: centerY + 120 }
        ];
        hubs.forEach(h => {
            positions[h.id] = { x: h.x, y: h.y };
        });

        const outerTables = SCHEMA_TABLES.filter(t => !['users', 'orders', 'dark_stores', 'product_variants'].includes(t.id));
        const radiusX = 860;
        const radiusY = 780;
        outerTables.forEach((t, idx) => {
            const angle = (idx / outerTables.length) * Math.PI * 2 - Math.PI / 2;
            positions[t.id] = {
                x: Math.round(centerX - CARD_WIDTH / 2 + Math.cos(angle) * radiusX),
                y: Math.round(centerY - 140 + Math.sin(angle) * radiusY)
            };
        });
    } else {
        // Sequential DDL Matrix (#01 to #23) in 5 neat columns
        const numCols = 5;
        const colW = 365;
        const colYs = Array(numCols).fill(160);
        SCHEMA_TABLES.forEach((t, i) => {
            const c = i % numCols;
            positions[t.id] = { x: 110 + c * colW, y: colYs[c] };
            colYs[c] += getCardHeight(t, onlyKeys) + 42;
        });
    }

    return positions;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SchemaNotebookPage() {
    // Layout & View State
    const [layoutMode, setLayoutMode] = useState('domain'); // 'domain' | 'hierarchy' | 'radial' | 'grid'
    const [onlyKeyColumns, setOnlyKeyColumns] = useState(false);
    const [tablePositions, setTablePositions] = useState(() => computeSmartLayout('domain', false));
    const [paperTheme, setPaperTheme] = useState('dot'); // 'dot' | 'ruled' | 'graph' | 'blueprint'
    const [lineStyle, setLineStyle] = useState('sketch'); // 'sketch' | 'orthogonal' | 'pulse'
    const [showDomainFrames, setShowDomainFrames] = useState(true);
    const [showLineLabels, setShowLineLabels] = useState(true);
    const [showStickyNotes, setShowStickyNotes] = useState(true);

    // Camera (Pan & Zoom) State
    const [camera, setCamera] = useState({ x: 35, y: 18, zoom: 0.58 });
    const viewportRef = useRef(null);
    const cameraRef = useRef(camera);
    cameraRef.current = camera;

    // Interactive Tooling (Apple Notes / Freeform Dock)
    const [activeTool, setActiveTool] = useState('select'); // 'select' | 'pan' | 'pen' | 'highlighter' | 'note' | 'eraser'
    const [inkColor, setInkColor] = useState('#1e293b');
    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState(null);
    const [stickyNotes, setStickyNotes] = useState(INITIAL_STICKY_NOTES);

    // Selection, Hover & Search
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [hoveredTableId, setHoveredTableId] = useState(null);
    const [selectedRelId, setSelectedRelId] = useState(null);
    const [hoveredRelId, setHoveredRelId] = useState(null);
    const [activeDomainFilter, setActiveDomainFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [inspectorTab, setInspectorTab] = useState('columns'); // 'columns' | 'relations' | 'data' | 'ddl'
    const [copiedDDL, setCopiedDDL] = useState(false);

    // Dragging refs for 1:1 zero-latency manipulation
    const dragStateRef = useRef(null);
    const isSpacePressedRef = useRef(false);

    const domainMap = useMemo(() => Object.fromEntries(SCHEMA_DOMAINS.map(d => [d.id, d])), []);
    const tableMap = useMemo(() => Object.fromEntries(SCHEMA_TABLES.map(t => [t.id, t])), []);

    // Fit entire 23-table schema into viewport
    const fitToScreen = useCallback((customPositions = null) => {
        const el = viewportRef.current;
        if (!el) return;
        const posMap = customPositions || tablePositions;
        const entries = Object.entries(posMap);
        if (entries.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        entries.forEach(([id, p]) => {
            const t = tableMap[id];
            const h = t ? getCardHeight(t, onlyKeyColumns) : 280;
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x + CARD_WIDTH > maxX) maxX = p.x + CARD_WIDTH;
            if (p.y + h > maxY) maxY = p.y + h;
        });

        const pad = 90;
        const contentW = (maxX - minX) + pad * 2;
        const contentH = (maxY - minY) + pad * 2;
        const rect = el.getBoundingClientRect();
        const availW = Math.max(400, rect.width - (selectedTableId ? 380 : 0));
        const availH = Math.max(300, rect.height);

        const nextZoom = Math.min(1.15, Math.max(0.22, Math.min(availW / contentW, availH / contentH)));
        const nextX = (availW - contentW * nextZoom) / 2 - (minX - pad) * nextZoom;
        const nextY = (availH - contentH * nextZoom) / 2 - (minY - pad) * nextZoom;

        setCamera({
            x: Math.round(nextX),
            y: Math.round(Math.max(12, nextY)),
            zoom: Number(nextZoom.toFixed(3))
        });
    }, [tablePositions, tableMap, onlyKeyColumns, selectedTableId]);

    // Apply Smart Layout Preset
    const handleApplySmartLayout = (mode) => {
        setLayoutMode(mode);
        const nextPositions = computeSmartLayout(mode, onlyKeyColumns);
        setTablePositions(nextPositions);
        setTimeout(() => fitToScreen(nextPositions), 30);
    };

    // Toggle Compact (PK/FK Only) vs Full Columns
    const handleToggleColumnsMode = () => {
        const nextOnlyKeys = !onlyKeyColumns;
        setOnlyKeyColumns(nextOnlyKeys);
        const nextPositions = computeSmartLayout(layoutMode, nextOnlyKeys);
        setTablePositions(nextPositions);
    };

    // Focus camera on a specific table card
    const focusTableOnCanvas = useCallback((tableId) => {
        const el = viewportRef.current;
        const pos = tablePositions[tableId];
        const t = tableMap[tableId];
        if (!el || !pos || !t) return;

        const rect = el.getBoundingClientRect();
        const availW = rect.width - 390; // leave room for right inspector
        const availH = rect.height;
        const targetZoom = 0.92;
        const cardH = getCardHeight(t, onlyKeyColumns);

        const cx = pos.x + CARD_WIDTH / 2;
        const cy = pos.y + cardH / 2;

        setCamera({
            x: Math.round(availW / 2 - cx * targetZoom),
            y: Math.round(availH / 2 - cy * targetZoom),
            zoom: targetZoom
        });
        setSelectedTableId(tableId);
    }, [tablePositions, tableMap, onlyKeyColumns]);

    // Initial fit on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            fitToScreen();
        }, 60);
        return () => clearTimeout(timer);
    }, []);

    // Keyboard shortcuts (Space to pan, +/- to zoom, 0 to fit, Escape to deselect)
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') {
                isSpacePressedRef.current = true;
            } else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                zoomByStep(0.12);
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                zoomByStep(-0.12);
            } else if (e.key === '0') {
                e.preventDefault();
                fitToScreen();
            } else if (e.key === 'Escape') {
                setSelectedTableId(null);
                setSelectedRelId(null);
            } else if (e.key.toLowerCase() === 'v') {
                setActiveTool('select');
            } else if (e.key.toLowerCase() === 'h') {
                setActiveTool('pan');
            } else if (e.key.toLowerCase() === 'p') {
                setActiveTool('pen');
            }
        };
        const onKeyUp = (e) => {
            if (e.code === 'Space') {
                isSpacePressedRef.current = false;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [fitToScreen]);

    // Non-passive Wheel listener for silky cursor-centered zoom & trackpad pan
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;

            const prev = cameraRef.current;
            // Zoom around cursor position
            const zoomFactor = Math.exp(-e.deltaY * 0.0014);
            const nextZoom = Math.min(2.5, Math.max(0.16, prev.zoom * zoomFactor));

            const worldX = (cursorX - prev.x) / prev.zoom;
            const worldY = (cursorY - prev.y) / prev.zoom;

            const nextX = cursorX - worldX * nextZoom;
            const nextY = cursorY - worldY * nextZoom;

            setCamera({
                x: nextX,
                y: nextY,
                zoom: Number(nextZoom.toFixed(4))
            });
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

    const zoomByStep = (delta) => {
        const el = viewportRef.current;
        const prev = cameraRef.current;
        const nextZoom = Math.min(2.5, Math.max(0.16, Number((prev.zoom + delta).toFixed(2))));
        if (!el) {
            setCamera({ ...prev, zoom: nextZoom });
            return;
        }
        const rect = el.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const worldX = (cx - prev.x) / prev.zoom;
        const worldY = (cy - prev.y) / prev.zoom;
        setCamera({
            x: cx - worldX * nextZoom,
            y: cy - worldY * nextZoom,
            zoom: nextZoom
        });
    };

    // Convert screen pointer coordinates to world canvas coordinates
    const screenToWorld = (clientX, clientY) => {
        const el = viewportRef.current;
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        const cam = cameraRef.current;
        return {
            x: (clientX - rect.left - cam.x) / cam.zoom,
            y: (clientY - rect.top - cam.y) / cam.zoom
        };
    };

    // ========================================================================
    // POINTER INTERACTIONS: PAN, DRAG TABLE, DRAG STICKY, DRAW INK
    // ========================================================================
    const handleCanvasPointerDown = (e) => {
        if (e.button !== 0 && e.button !== 1) return;

        // If user clicked Sticky Note tool on empty canvas, drop a new note
        if (activeTool === 'note' && e.target === e.currentTarget) {
            const pt = screenToWorld(e.clientX, e.clientY);
            const palette = [
                { color: '#fff3bf', border: '#fcc419' },
                { color: '#e6fcf5', border: '#20c997' },
                { color: '#e7f5ff', border: '#339af0' },
                { color: '#fff0f6', border: '#f06595' }
            ][stickyNotes.length % 4];

            setStickyNotes(prev => [
                ...prev,
                {
                    id: `note-${Date.now()}`,
                    x: Math.round(pt.x - 120),
                    y: Math.round(pt.y - 40),
                    width: 260,
                    color: palette.color,
                    border: palette.border,
                    rotation: (Math.random() * 2 - 1).toFixed(2),
                    title: '📝 Schema Note',
                    text: 'Double-click or type to annotate tables and joins...'
                }
            ]);
            setActiveTool('select');
            return;
        }

        // If Pen or Highlighter is active, start freehand ink stroke
        if (activeTool === 'pen' || activeTool === 'highlighter') {
            e.currentTarget.setPointerCapture(e.pointerId);
            const pt = screenToWorld(e.clientX, e.clientY);
            const stroke = {
                id: `stroke-${Date.now()}`,
                tool: activeTool,
                color: activeTool === 'highlighter' ? '#fcc419' : inkColor,
                width: activeTool === 'highlighter' ? 18 : 3.2,
                opacity: activeTool === 'highlighter' ? 0.38 : 0.92,
                points: [pt]
            };
            setCurrentStroke(stroke);
            dragStateRef.current = { type: 'draw', pointerId: e.pointerId };
            return;
        }

        // Otherwise start Canvas Pan
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStateRef.current = {
            type: 'pan',
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origCamX: camera.x,
            origCamY: camera.y
        };
    };

    const handleTablePointerDown = (e, tableId) => {
        if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'pan' || isSpacePressedRef.current) {
            return; // Let event bubble to canvas for drawing/panning
        }
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        const pos = tablePositions[tableId] || { x: 0, y: 0 };
        dragStateRef.current = {
            type: 'table',
            tableId,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origX: pos.x,
            origY: pos.y,
            moved: false
        };
    };

    const handleStickyPointerDown = (e, noteId) => {
        if (activeTool === 'pen' || activeTool === 'highlighter') return;
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        const note = stickyNotes.find(n => n.id === noteId);
        if (!note) return;
        dragStateRef.current = {
            type: 'sticky',
            noteId,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            origX: note.x,
            origY: note.y
        };
    };

    const handleGlobalPointerMove = (e) => {
        const drag = dragStateRef.current;
        if (!drag) return;

        if (drag.type === 'pan') {
            const dx = e.clientX - drag.startX;
            const dy = e.clientY - drag.startY;
            setCamera(prev => ({
                ...prev,
                x: drag.origCamX + dx,
                y: drag.origCamY + dy
            }));
        } else if (drag.type === 'table') {
            const dx = (e.clientX - drag.startX) / cameraRef.current.zoom;
            const dy = (e.clientY - drag.startY) / cameraRef.current.zoom;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
            setTablePositions(prev => ({
                ...prev,
                [drag.tableId]: {
                    x: Math.round(drag.origX + dx),
                    y: Math.round(drag.origY + dy)
                }
            }));
        } else if (drag.type === 'sticky') {
            const dx = (e.clientX - drag.startX) / cameraRef.current.zoom;
            const dy = (e.clientY - drag.startY) / cameraRef.current.zoom;
            setStickyNotes(prev =>
                prev.map(n =>
                    n.id === drag.noteId
                        ? { ...n, x: Math.round(drag.origX + dx), y: Math.round(drag.origY + dy) }
                        : n
                )
            );
        } else if (drag.type === 'draw' && currentStroke) {
            const pt = screenToWorld(e.clientX, e.clientY);
            setCurrentStroke(prev => (prev ? { ...prev, points: [...prev.points, pt] } : null));
        }
    };

    const handleGlobalPointerUp = () => {
        const drag = dragStateRef.current;
        if (!drag) return;

        if (drag.type === 'table' && !drag.moved) {
            setSelectedTableId(drag.tableId);
            setSelectedRelId(null);
        } else if (drag.type === 'draw' && currentStroke) {
            if (currentStroke.points.length > 1) {
                setStrokes(prev => [...prev, currentStroke]);
            }
            setCurrentStroke(null);
        }
        dragStateRef.current = null;
    };

    // ========================================================================
    // COMPUTE DOMAIN GROUP FRAMES & PRECISION COLUMN-TO-COLUMN CONNECTORS
    // ========================================================================
    const domainFrames = useMemo(() => {
        return SCHEMA_DOMAINS.map(dom => {
            const domTables = SCHEMA_TABLES.filter(t => t.domain === dom.id);
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            domTables.forEach(t => {
                const p = tablePositions[t.id];
                if (!p) return;
                const h = getCardHeight(t, onlyKeyColumns);
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x + CARD_WIDTH > maxX) maxX = p.x + CARD_WIDTH;
                if (p.y + h > maxY) maxY = p.y + h;
            });
            if (minX === Infinity) return null;
            return {
                ...dom,
                x: minX - 28,
                y: minY - 52,
                width: (maxX - minX) + 56,
                height: (maxY - minY) + 78
            };
        }).filter(Boolean);
    }, [tablePositions, onlyKeyColumns]);

    // Active focus set: which tables & relationships are highlighted?
    const focusTableId = hoveredTableId || selectedTableId;
    const connectedInfo = useMemo(() => {
        if (!focusTableId) return { tableIds: new Set(), relIds: new Set() };
        const tIds = new Set([focusTableId]);
        const rIds = new Set();
        SCHEMA_RELATIONSHIPS.forEach(rel => {
            if (rel.sourceTable === focusTableId || rel.targetTable === focusTableId) {
                rIds.add(rel.id);
                tIds.add(rel.sourceTable);
                tIds.add(rel.targetTable);
            }
        });
        return { tableIds: tIds, relIds: rIds };
    }, [focusTableId]);

    // Compute exact SVG geometry for all 32 Foreign Key relationships
    const computedConnectors = useMemo(() => {
        return SCHEMA_RELATIONSHIPS.map((rel, idx) => {
            const sTable = tableMap[rel.sourceTable];
            const tTable = tableMap[rel.targetTable];
            const sPos = tablePositions[rel.sourceTable];
            const tPos = tablePositions[rel.targetTable];
            if (!sTable || !tTable || !sPos || !tPos) return null;

            const sCols = getVisibleColumns(sTable, onlyKeyColumns);
            const tCols = getVisibleColumns(tTable, onlyKeyColumns);

            const sColIdx = Math.max(0, sCols.findIndex(c => c.name === rel.sourceCol));
            const tColIdx = Math.max(0, tCols.findIndex(c => c.name === rel.targetCol));

            const y1 = sPos.y + HEADER_HEIGHT + sColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
            const y2 = tPos.y + HEADER_HEIGHT + tColIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

            const domainObj = domainMap[sTable.domain];
            const strokeColor = domainObj ? domainObj.color : '#0ca678';

            // Case 1: Self-referencing FK (categories.parent_category_id -> categories.category_id)
            if (rel.isSelf) {
                const xRight = sPos.x + CARD_WIDTH;
                const loopW = 54;
                const path = `M ${xRight} ${y1} C ${xRight + loopW} ${y1 + 12}, ${xRight + loopW} ${y2 - 12}, ${xRight} ${y2}`;
                return {
                    ...rel,
                    path,
                    x1: xRight,
                    y1,
                    x2: xRight,
                    y2,
                    dir1: 1,
                    dir2: 1,
                    labelX: xRight + loopW + 4,
                    labelY: (y1 + y2) / 2,
                    color: strokeColor
                };
            }

            const sCenter = sPos.x + CARD_WIDTH / 2;
            const tCenter = tPos.x + CARD_WIDTH / 2;
            const dxCenters = tCenter - sCenter;

            let x1, x2, dir1, dir2, path, labelX, labelY;

            // Case 2: Both tables are vertically aligned in the same column -> Route C-curve outside the cards!
            if (Math.abs(dxCenters) < CARD_WIDTH * 0.88) {
                const useRightSide = idx % 2 === 0;
                dir1 = useRightSide ? 1 : -1;
                dir2 = dir1;
                x1 = useRightSide ? sPos.x + CARD_WIDTH : sPos.x;
                x2 = useRightSide ? tPos.x + CARD_WIDTH : tPos.x;

                const outerX = useRightSide
                    ? Math.max(x1, x2) + 52 + (idx % 3) * 14
                    : Math.min(x1, x2) - 52 - (idx % 3) * 14;

                if (lineStyle === 'orthogonal') {
                    path = `M ${x1} ${y1} L ${outerX} ${y1} L ${outerX} ${y2} L ${x2} ${y2}`;
                } else {
                    path = `M ${x1} ${y1} C ${outerX} ${y1}, ${outerX} ${y2}, ${x2} ${y2}`;
                }
                labelX = outerX;
                labelY = (y1 + y2) / 2;
            } else {
                // Case 3: Tables are in different columns -> Connect facing ports
                if (dxCenters > 0) {
                    x1 = sPos.x + CARD_WIDTH;
                    x2 = tPos.x;
                    dir1 = 1;
                    dir2 = -1;
                } else {
                    x1 = sPos.x;
                    x2 = tPos.x + CARD_WIDTH;
                    dir1 = -1;
                    dir2 = 1;
                }

                const dist = Math.abs(x2 - x1);
                const curvature = Math.max(65, Math.min(220, dist * 0.45));

                if (lineStyle === 'orthogonal') {
                    const midX = (x1 + x2) / 2 + ((idx % 5) - 2) * 8;
                    path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                    labelX = midX;
                    labelY = (y1 + y2) / 2;
                } else {
                    const cx1 = x1 + dir1 * curvature;
                    const cx2 = x2 + dir2 * curvature;
                    path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
                    labelX = (x1 + x2) / 2;
                    labelY = (y1 + y2) / 2 + (rel.id === 'fk_transfer_dest' ? 14 : rel.id === 'fk_transfer_source' ? -14 : 0);
                }
            }

            return {
                ...rel,
                path,
                x1,
                y1,
                x2,
                y2,
                dir1,
                dir2,
                labelX,
                labelY,
                color: strokeColor
            };
        }).filter(Boolean);
    }, [tablePositions, tableMap, domainMap, onlyKeyColumns, lineStyle]);

    // Search & Domain Filter Matching
    const matchingTableIds = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return new Set(
            SCHEMA_TABLES.filter(t => {
                const domainOk = activeDomainFilter === 'ALL' || t.domain === activeDomainFilter;
                if (!domainOk) return false;
                if (!q) return true;
                const nameMatch = t.name.toLowerCase().includes(q) || t.comment.toLowerCase().includes(q);
                const colMatch = t.columns.some(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
                return nameMatch || colMatch;
            }).map(t => t.id)
        );
    }, [searchQuery, activeDomainFilter]);

    // Selected Table & Relationship Objects for Inspector
    const selectedTable = selectedTableId ? tableMap[selectedTableId] : null;
    const selectedRel = selectedRelId ? computedConnectors.find(r => r.id === selectedRelId) : null;

    // Generate SQL CREATE TABLE DDL for inspector
    const generateTableDDL = (table) => {
        if (!table) return '';
        const colLines = table.columns.map(c => {
            let line = `    ${c.name} ${c.type} ${c.nullable ? 'NULL' : 'NOT NULL'}`;
            if (c.autoInc) line += ' AUTO_INCREMENT';
            if (c.defaultVal) line += ` DEFAULT ${c.defaultVal}`;
            if (c.isPK) line += ' PRIMARY KEY';
            return line;
        });
        const fkLines = SCHEMA_RELATIONSHIPS
            .filter(r => r.sourceTable === table.id)
            .map(r => `    CONSTRAINT ${r.id} FOREIGN KEY (${r.sourceCol}) REFERENCES ${r.targetTable}(${r.targetCol}) ON DELETE ${r.onDelete}`);

        return `CREATE TABLE ${table.name} (\n${[...colLines, ...fkLines].join(',\n')}\n) ENGINE=InnoDB COMMENT='${table.comment}';`;
    };

    const handleCopyDDL = () => {
        if (!selectedTable) return;
        navigator.clipboard.writeText(generateTableDDL(selectedTable));
        setCopiedDDL(true);
        setTimeout(() => setCopiedDDL(false), 2000);
    };

    // Paper background CSS generator
    const getPaperBackgroundStyle = () => {
        const scaledGrid = Math.max(12, Math.round(24 * camera.zoom));
        const ox = Math.round(camera.x % scaledGrid);
        const oy = Math.round(camera.y % scaledGrid);

        if (paperTheme === 'blueprint') {
            return {
                backgroundColor: '#0b1528',
                backgroundImage: `
                    linear-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56, 189, 248, 0.12) 1px, transparent 1px),
                    linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: `${scaledGrid * 4}px ${scaledGrid * 4}px, ${scaledGrid * 4}px ${scaledGrid * 4}px, ${scaledGrid}px ${scaledGrid}px, ${scaledGrid}px ${scaledGrid}px`,
                backgroundPosition: `${ox}px ${oy}px`
            };
        }
        if (paperTheme === 'ruled') {
            const lineStep = Math.max(16, Math.round(32 * camera.zoom));
            return {
                backgroundColor: '#fdfaf0',
                backgroundImage: `
                    linear-gradient(90deg, transparent ${Math.max(40, 76 * camera.zoom)}px, rgba(250, 82, 82, 0.32) ${Math.max(40, 76 * camera.zoom)}px, rgba(250, 82, 82, 0.32) ${Math.max(40, 76 * camera.zoom) + 1.5}px, transparent ${Math.max(40, 76 * camera.zoom) + 1.5}px),
                    repeating-linear-gradient(0deg, transparent, transparent ${lineStep - 1}px, rgba(59, 130, 246, 0.16) ${lineStep - 1}px, rgba(59, 130, 246, 0.16) ${lineStep}px)
                `,
                backgroundPosition: `0 ${oy}px`
            };
        }
        if (paperTheme === 'graph') {
            return {
                backgroundColor: '#f8fafc',
                backgroundImage: `
                    linear-gradient(rgba(148, 163, 184, 0.24) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(148, 163, 184, 0.24) 1px, transparent 1px)
                `,
                backgroundSize: `${scaledGrid}px ${scaledGrid}px`,
                backgroundPosition: `${ox}px ${oy}px`
            };
        }
        // Default: Apple Notes / Freeform Warm Dot-Grid Sketchpad
        return {
            backgroundColor: '#faf8f2',
            backgroundImage: `radial-gradient(rgba(100, 116, 139, 0.34) ${Math.max(1, 1.35 * camera.zoom)}px, transparent ${Math.max(1, 1.35 * camera.zoom)}px)`,
            backgroundSize: `${scaledGrid}px ${scaledGrid}px`,
            backgroundPosition: `${ox}px ${oy}px`
        };
    };

    const isDarkPaper = paperTheme === 'blueprint';

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: 'calc(100vh - 49px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                ...getPaperBackgroundStyle()
            }}
        >
            {/* ====================================================================
                TOP TRANSLUCENT APPLE NOTES / FREEFORM CONTROL BAR
               ==================================================================== */}
            <div
                style={{
                    position: 'absolute',
                    top: 14,
                    left: 16,
                    right: 16,
                    zIndex: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    pointerEvents: 'none'
                }}
            >
                {/* Left Cluster: Notebook Title, Stats & Search */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: isDarkPaper ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: isDarkPaper ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15, 23, 42, 0.09)',
                        padding: '8px 14px',
                        borderRadius: 14,
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        pointerEvents: 'auto'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 9,
                                background: 'linear-gradient(135deg, #fcc419 0%, #f59f00 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1e293b',
                                boxShadow: '0 2px 8px rgba(245, 159, 0, 0.35)'
                            }}
                        >
                            <FileText size={17} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isDarkPaper ? '#f8fafc' : '#0f172a', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>QuickKart Schema Sketchbook</span>
                                <span style={{
                                    fontSize: '0.68rem',
                                    background: '#e6fcf5',
                                    color: '#087f5b',
                                    padding: '1px 7px',
                                    borderRadius: 999,
                                    fontWeight: 800
                                }}>
                                    23 Tables • 32 FKs
                                </span>
                            </div>
                            <div style={{ fontSize: '0.71rem', color: isDarkPaper ? '#94a3b8' : '#64748b' }}>
                                Infinite canvas • Scroll/pinch to zoom • Drag tables or sketch with Pencil
                            </div>
                        </div>
                    </div>

                    {/* Search Tables / Columns Input */}
                    <div style={{ position: 'relative', width: 210 }}>
                        <Search
                            size={14}
                            color="#94a3b8"
                            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find table or column..."
                            style={{
                                width: '100%',
                                padding: '6px 26px 6px 30px',
                                borderRadius: 9,
                                border: isDarkPaper ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
                                background: isDarkPaper ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc',
                                color: isDarkPaper ? '#f8fafc' : '#0f172a',
                                fontSize: '0.78rem',
                                outline: 'none'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: 6,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#94a3b8',
                                    display: 'flex'
                                }}
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Center Cluster: Smart Arrange Presets */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isDarkPaper ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: isDarkPaper ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15, 23, 42, 0.09)',
                        padding: '6px 10px',
                        borderRadius: 14,
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        pointerEvents: 'auto'
                    }}
                >
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                        <Sparkles size={13} color="#f59f00" />
                        <span>Smart Arrange:</span>
                    </span>
                    {[
                        { id: 'domain', label: 'Domain Clusters', icon: Layers },
                        { id: 'hierarchy', label: 'Tiered DAG (L→R)', icon: Workflow },
                        { id: 'radial', label: 'Hub Constellation', icon: Compass },
                        { id: 'grid', label: 'DDL Grid (#1–23)', icon: Grid }
                    ].map(preset => {
                        const Icon = preset.icon;
                        const active = layoutMode === preset.id;
                        return (
                            <button
                                key={preset.id}
                                onClick={() => handleApplySmartLayout(preset.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: active ? 700 : 600,
                                    background: active ? '#0ca678' : 'transparent',
                                    color: active ? '#ffffff' : (isDarkPaper ? '#cbd5e1' : '#475569'),
                                    transition: 'all 140ms ease'
                                }}
                            >
                                <Icon size={13} />
                                <span>{preset.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Cluster: Paper Texture, Connector Style & View Toggles */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isDarkPaper ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: isDarkPaper ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(15, 23, 42, 0.09)',
                        padding: '6px 10px',
                        borderRadius: 14,
                        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                        pointerEvents: 'auto'
                    }}
                >
                    {/* Paper Style Selector */}
                    <select
                        value={paperTheme}
                        onChange={(e) => setPaperTheme(e.target.value)}
                        title="Notebook Paper Texture"
                        style={{
                            padding: '5px 8px',
                            borderRadius: 8,
                            border: isDarkPaper ? '1px solid rgba(255,255,255,0.16)' : '1px solid #e2e8f0',
                            background: isDarkPaper ? '#1e293b' : '#f8fafc',
                            color: isDarkPaper ? '#f8fafc' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="dot">🗒️ Warm Dot-Grid Pad</option>
                        <option value="ruled">📒 Ruled Legal Notepad</option>
                        <option value="graph">📐 Technical Graph Paper</option>
                        <option value="blueprint">🌌 Midnight Blueprint</option>
                    </select>

                    {/* Line Connector Style */}
                    <select
                        value={lineStyle}
                        onChange={(e) => setLineStyle(e.target.value)}
                        title="Connector Line Routing Style"
                        style={{
                            padding: '5px 8px',
                            borderRadius: 8,
                            border: isDarkPaper ? '1px solid rgba(255,255,255,0.16)' : '1px solid #e2e8f0',
                            background: isDarkPaper ? '#1e293b' : '#f8fafc',
                            color: isDarkPaper ? '#f8fafc' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="sketch">✒️ Sketch Ink Curves</option>
                        <option value="pulse">⚡ Animated Flow Pulses</option>
                        <option value="orthogonal">📏 Orthogonal Circuit</option>
                    </select>

                    {/* Toggle Keys-Only vs Full Columns */}
                    <button
                        onClick={handleToggleColumnsMode}
                        title="Toggle between All Columns (185) and PK/FK Key Columns"
                        style={{
                            padding: '5px 9px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: onlyKeyColumns ? '#fff9db' : (isDarkPaper ? '#1e293b' : '#ffffff'),
                            color: onlyKeyColumns ? '#d9480f' : (isDarkPaper ? '#e2e8f0' : '#475569'),
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <Key size={12} />
                        <span>{onlyKeyColumns ? 'PK/FK Only' : 'All 185 Cols'}</span>
                    </button>

                    {/* Toggle Sticky Notes */}
                    <button
                        onClick={() => setShowStickyNotes(v => !v)}
                        title="Show/Hide Notebook Sticky Notes"
                        style={{
                            padding: '5px 9px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: showStickyNotes ? '#fff3bf' : (isDarkPaper ? '#1e293b' : '#ffffff'),
                            color: showStickyNotes ? '#b45309' : '#64748b',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        {showStickyNotes ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>Notes</span>
                    </button>
                </div>
            </div>

            {/* ====================================================================
                DOMAIN FILTER PILLS BAR (SECOND FLOATING STRIP)
               ==================================================================== */}
            <div
                style={{
                    position: 'absolute',
                    top: 68,
                    left: 16,
                    zIndex: 35,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    pointerEvents: 'auto'
                }}
            >
                <button
                    onClick={() => setActiveDomainFilter('ALL')}
                    style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        border: activeDomainFilter === 'ALL' ? '1.5px solid #0f172a' : '1px solid rgba(148,163,184,0.35)',
                        background: activeDomainFilter === 'ALL' ? '#0f172a' : (isDarkPaper ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.85)'),
                        color: activeDomainFilter === 'ALL' ? '#ffffff' : (isDarkPaper ? '#cbd5e1' : '#475569'),
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    All 8 Domains (23)
                </button>
                {SCHEMA_DOMAINS.map(dom => {
                    const isAct = activeDomainFilter === dom.id;
                    return (
                        <button
                            key={dom.id}
                            onClick={() => setActiveDomainFilter(isAct ? 'ALL' : dom.id)}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: `1.5px solid ${isAct ? dom.color : 'rgba(148,163,184,0.3)'}`,
                                background: isAct ? dom.color : (isDarkPaper ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.88)'),
                                color: isAct ? '#ffffff' : (isDarkPaper ? '#e2e8f0' : '#334155'),
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                backdropFilter: 'blur(8px)',
                                transition: 'all 120ms ease'
                            }}
                        >
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: isAct ? '#ffffff' : dom.color
                                }}
                            />
                            <span>{dom.id}. {dom.shortName} ({dom.tables.length})</span>
                        </button>
                    );
                })}
            </div>

            {/* ====================================================================
                MAIN INFINITE INTERACTIVE CANVAS VIEWPORT
               ==================================================================== */}
            <div
                ref={viewportRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleGlobalPointerMove}
                onPointerUp={handleGlobalPointerUp}
                style={{
                    flex: 1,
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor:
                        activeTool === 'pan' || isSpacePressedRef.current
                            ? 'grab'
                            : activeTool === 'pen' || activeTool === 'highlighter'
                            ? 'crosshair'
                            : activeTool === 'note'
                            ? 'copy'
                            : 'default',
                    touchAction: 'none'
                }}
            >
                {/* TRANSFORMED WORLD PLANE */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 3200,
                        height: 2600,
                        transformOrigin: '0 0',
                        transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.zoom})`,
                        willChange: 'transform'
                    }}
                >
                    {/* --------------------------------------------------------------
                        1. DOMAIN ZONE FRAMES (NOTEBOOK SECTION BOXES)
                       -------------------------------------------------------------- */}
                    {showDomainFrames &&
                        domainFrames.map(frame => {
                            const isDimmed = activeDomainFilter !== 'ALL' && activeDomainFilter !== frame.id;
                            return (
                                <div
                                    key={frame.id}
                                    style={{
                                        position: 'absolute',
                                        left: frame.x,
                                        top: frame.y,
                                        width: frame.width,
                                        height: frame.height,
                                        background: frame.bgTint,
                                        border: `2px dashed ${frame.borderTint}`,
                                        borderRadius: 20,
                                        pointerEvents: 'none',
                                        opacity: isDimmed ? 0.22 : 1,
                                        transition: 'opacity 180ms ease'
                                    }}
                                >
                                    {/* Domain Sketch Header Tag */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: -14,
                                            left: 18,
                                            background: isDarkPaper ? '#0f172a' : '#ffffff',
                                            border: `1.5px solid ${frame.color}`,
                                            color: frame.color,
                                            padding: '3px 12px',
                                            borderRadius: 999,
                                            fontSize: '0.74rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.03em',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6
                                        }}
                                    >
                                        <span>{frame.code}: {frame.name}</span>
                                        <span style={{ opacity: 0.75 }}>({frame.tables.length} tables)</span>
                                    </div>
                                </div>
                            );
                        })}

                    {/* --------------------------------------------------------------
                        2. SVG LAYER: ALL 32 FOREIGN KEY CONNECTOR LINES & INK STROKES
                       -------------------------------------------------------------- */}
                    <svg
                        width={3600}
                        height={3000}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            overflow: 'visible',
                            pointerEvents: 'none',
                            zIndex: 12
                        }}
                    >
                        <defs>
                            {/* Subtle hand-drawn sketch turbulence filter for Apple Notes feel */}
                            <filter id="notebook-sketch-filter" x="-5%" y="-5%" width="110%" height="110%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.15" xChannelSelector="R" yChannelSelector="G" />
                            </filter>
                        </defs>

                        {/* Render All 32 Foreign Key Relationship Lines */}
                        {computedConnectors.map(conn => {
                            const isHovered = hoveredRelId === conn.id || selectedRelId === conn.id;
                            const isConnectedToFocus = focusTableId ? conn.sourceTable === focusTableId || conn.targetTable === focusTableId : false;
                            const isDimmedByFocus =
                                (focusTableId && !isConnectedToFocus) ||
                                (activeDomainFilter !== 'ALL' &&
                                    !matchingTableIds.has(conn.sourceTable) &&
                                    !matchingTableIds.has(conn.targetTable));

                            const activeHighlight = isHovered || isConnectedToFocus;
                            const lineColor = activeHighlight
                                ? conn.color
                                : isDarkPaper
                                ? 'rgba(148, 163, 184, 0.52)'
                                : 'rgba(71, 85, 105, 0.46)';

                            const strokeWidth = isHovered ? 3.4 : isConnectedToFocus ? 2.8 : 1.75;
                            const opacity = isDimmedByFocus ? 0.14 : activeHighlight ? 1 : 0.82;

                            // Crow's foot (many) marker at source FK port & 1-bar marker at target PK port
                            const cfSpread = 5;
                            const cfLen = 9 * conn.dir1;
                            const crowFootPath =
                                conn.cardinality === '1:1'
                                    ? `M ${conn.x1 + conn.dir1 * 6} ${conn.y1 - 5} L ${conn.x1 + conn.dir1 * 6} ${conn.y1 + 5}`
                                    : `M ${conn.x1 + cfLen} ${conn.y1} L ${conn.x1} ${conn.y1 - cfSpread} M ${conn.x1 + cfLen} ${conn.y1} L ${conn.x1} ${conn.y1 + cfSpread}`;

                            const pkTickX = conn.x2 + conn.dir2 * 6;
                            const pkTickPath = `M ${pkTickX} ${conn.y2 - 5} L ${pkTickX} ${conn.y2 + 5}`;

                            return (
                                <g key={conn.id} style={{ opacity, transition: 'opacity 160ms ease' }}>
                                    {/* Invisible wide hit-area so clicking/hovering a relationship line is effortless */}
                                    <path
                                        d={conn.path}
                                        fill="none"
                                        stroke="transparent"
                                        strokeWidth={14}
                                        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                                        onPointerEnter={() => setHoveredRelId(conn.id)}
                                        onPointerLeave={() => setHoveredRelId(null)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRelId(conn.id === selectedRelId ? null : conn.id);
                                        }}
                                    />

                                    {/* Soft glow halo when highlighted */}
                                    {activeHighlight && (
                                        <path
                                            d={conn.path}
                                            fill="none"
                                            stroke={conn.color}
                                            strokeWidth={strokeWidth + 5}
                                            strokeOpacity={0.18}
                                            strokeLinecap="round"
                                        />
                                    )}

                                    {/* Main Relationship Connector Curve */}
                                    <path
                                        d={conn.path}
                                        fill="none"
                                        stroke={lineColor}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        strokeDasharray={
                                            lineStyle === 'pulse'
                                                ? '8 5'
                                                : conn.onDelete === 'SET NULL'
                                                ? '5 4'
                                                : 'none'
                                        }
                                        filter={lineStyle === 'sketch' ? 'url(#notebook-sketch-filter)' : undefined}
                                    >
                                        {(lineStyle === 'pulse' || activeHighlight) && (
                                            <animate
                                                attributeName="stroke-dashoffset"
                                                from="26"
                                                to="0"
                                                dur="0.9s"
                                                repeatCount="indefinite"
                                            />
                                        )}
                                    </path>

                                    {/* Source FK Crow's Foot & Port Dot */}
                                    <path d={crowFootPath} stroke={lineColor} strokeWidth={1.8} fill="none" />
                                    <circle cx={conn.x1} cy={conn.y1} r={activeHighlight ? 4.2 : 3} fill={conn.color} />

                                    {/* Target PK 1-Bar Tick & Port Dot */}
                                    <path d={pkTickPath} stroke={lineColor} strokeWidth={2} fill="none" />
                                    <circle cx={conn.x2} cy={conn.y2} r={activeHighlight ? 4.2 : 3} fill="#f59f00" />

                                    {/* Relationship Verb Pill at Midpoint */}
                                    {(showLineLabels || activeHighlight) && (
                                        <g
                                            transform={`translate(${conn.labelX}, ${conn.labelY})`}
                                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedRelId(conn.id === selectedRelId ? null : conn.id);
                                            }}
                                        >
                                            <rect
                                                x={-42}
                                                y={-9}
                                                width={84}
                                                height={18}
                                                rx={9}
                                                fill={activeHighlight ? conn.color : (isDarkPaper ? '#1e293b' : '#ffffff')}
                                                stroke={activeHighlight ? conn.color : 'rgba(148,163,184,0.45)'}
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={0}
                                                y={3.5}
                                                textAnchor="middle"
                                                fontSize={9.5}
                                                fontWeight={700}
                                                fill={activeHighlight ? '#ffffff' : (isDarkPaper ? '#cbd5e1' : '#475569')}
                                            >
                                                {conn.label}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {/* User Freehand Apple Pencil / Highlighter Ink Strokes */}
                        {[...strokes, ...(currentStroke ? [currentStroke] : [])].map(st => {
                            if (!st.points || st.points.length < 2) return null;
                            const d = st.points.reduce(
                                (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                                ''
                            );
                            return (
                                <path
                                    key={st.id}
                                    d={d}
                                    fill="none"
                                    stroke={st.color}
                                    strokeWidth={st.width}
                                    strokeOpacity={st.opacity}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none',
                                        cursor: activeTool === 'eraser' ? 'pointer' : 'default'
                                    }}
                                    onClick={() => {
                                        if (activeTool === 'eraser') {
                                            setStrokes(prev => prev.filter(s => s.id !== st.id));
                                        }
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* --------------------------------------------------------------
                        3. ALL 23 SMART-ARRANGED DRAGGABLE TABLE CARDS
                       -------------------------------------------------------------- */}
                    {SCHEMA_TABLES.map(table => {
                        const pos = tablePositions[table.id] || { x: 100, y: 100 };
                        const dom = domainMap[table.domain];
                        const visibleCols = getVisibleColumns(table, onlyKeyColumns);
                        const isSelected = selectedTableId === table.id;
                        const isHovered = hoveredTableId === table.id;
                        const isNeighbor = connectedInfo.tableIds.has(table.id);
                        const isSearchMatch = matchingTableIds.has(table.id);

                        const isDimmed =
                            (focusTableId && !isNeighbor) ||
                            !isSearchMatch;

                        const q = searchQuery.trim().toLowerCase();

                        return (
                            <div
                                key={table.id}
                                onPointerDown={(e) => handleTablePointerDown(e, table.id)}
                                onPointerEnter={() => setHoveredTableId(table.id)}
                                onPointerLeave={() => setHoveredTableId(null)}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    focusTableOnCanvas(table.id);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: pos.x,
                                    top: pos.y,
                                    width: CARD_WIDTH,
                                    background: isDarkPaper ? '#132038' : '#ffffff',
                                    borderRadius: 12,
                                    border: isSelected
                                        ? `2.5px solid ${dom.color}`
                                        : isHovered || (focusTableId && isNeighbor)
                                        ? `2px solid ${dom.color}`
                                        : isDarkPaper
                                        ? '1.5px solid rgba(255,255,255,0.14)'
                                        : '1.5px solid #cbd5e1',
                                    boxShadow: isSelected
                                        ? `0 16px 34px -6px ${dom.color}40, 0 0 0 4px ${dom.color}20`
                                        : isHovered
                                        ? '0 14px 28px -6px rgba(15, 23, 42, 0.16)'
                                        : '0 4px 12px rgba(15, 23, 42, 0.07)',
                                    opacity: isDimmed ? 0.28 : 1,
                                    zIndex: isSelected ? 30 : isHovered ? 26 : 18,
                                    cursor: activeTool === 'select' ? 'grab' : 'inherit',
                                    transition: 'opacity 160ms ease, box-shadow 160ms ease, border-color 140ms ease',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Table Header (Exact 50px Height for Precision Port Math) */}
                                <div
                                    style={{
                                        height: HEADER_HEIGHT,
                                        padding: '0 12px',
                                        background: `linear-gradient(135deg, ${dom.color} 0%, ${dom.color}dd 100%)`,
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderBottom: '1px solid rgba(0,0,0,0.08)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                        <span
                                            style={{
                                                background: 'rgba(255,255,255,0.22)',
                                                color: '#ffffff',
                                                fontSize: '0.67rem',
                                                fontWeight: 800,
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            #{String(table.number).padStart(2, '0')}
                                        </span>
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: '0.86rem',
                                                    fontWeight: 800,
                                                    letterSpacing: '-0.01em',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}
                                            >
                                                {table.name}
                                            </div>
                                            <div style={{ fontSize: '0.64rem', opacity: 0.88, fontWeight: 600 }}>
                                                Domain {table.domain} • {table.rowCount} seed rows
                                            </div>
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            background: 'rgba(15, 23, 42, 0.25)',
                                            padding: '2px 7px',
                                            borderRadius: 999,
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {table.columns.length} cols
                                    </span>
                                </div>

                                {/* Columns List (Exact 26px per Row for Precision Port Math) */}
                                <div>
                                    {visibleCols.map((col, idx) => {
                                        const isColHighlighted = q && (col.name.toLowerCase().includes(q) || col.type.toLowerCase().includes(q));
                                        return (
                                            <div
                                                key={col.name}
                                                style={{
                                                    height: ROW_HEIGHT,
                                                    padding: '0 10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    fontSize: '0.73rem',
                                                    borderBottom:
                                                        idx < visibleCols.length - 1
                                                            ? isDarkPaper
                                                                ? '1px solid rgba(255,255,255,0.05)'
                                                                : '1px solid #f1f5f9'
                                                            : 'none',
                                                    background: isColHighlighted
                                                        ? '#fff3bf'
                                                        : col.isPK
                                                        ? isDarkPaper
                                                            ? 'rgba(252, 196, 25, 0.1)'
                                                            : 'rgba(255, 249, 219, 0.65)'
                                                        : col.isFK
                                                        ? isDarkPaper
                                                            ? 'rgba(12, 166, 120, 0.1)'
                                                            : 'rgba(230, 252, 245, 0.55)'
                                                        : 'transparent'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                    {/* Key Icon Badge */}
                                                    {col.isPK ? (
                                                        <span
                                                            title="Primary Key"
                                                            style={{
                                                                color: '#d97706',
                                                                fontWeight: 800,
                                                                fontSize: '0.63rem',
                                                                background: '#fef3c7',
                                                                padding: '0 4px',
                                                                borderRadius: 4
                                                            }}
                                                        >
                                                            PK
                                                        </span>
                                                    ) : col.isFK ? (
                                                        <span
                                                            title={`Foreign Key -> ${col.fkTarget}`}
                                                            style={{
                                                                color: dom.color,
                                                                fontWeight: 800,
                                                                fontSize: '0.63rem',
                                                                background: dom.badgeBg,
                                                                padding: '0 4px',
                                                                borderRadius: 4
                                                            }}
                                                        >
                                                            FK
                                                        </span>
                                                    ) : (
                                                        <span style={{ width: 20, textAlign: 'center', color: '#94a3b8', fontSize: '0.6rem' }}>
                                                            •
                                                        </span>
                                                    )}

                                                    <span
                                                        style={{
                                                            fontWeight: col.isPK || col.isFK ? 700 : 500,
                                                            color: isColHighlighted
                                                                ? '#0f172a'
                                                                : isDarkPaper
                                                                ? '#e2e8f0'
                                                                : '#1e293b',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {col.name}
                                                    </span>

                                                    {col.isUnique && !col.isPK && (
                                                        <span
                                                            title="UNIQUE Constraint"
                                                            style={{
                                                                fontSize: '0.58rem',
                                                                background: '#e7f5ff',
                                                                color: '#1971c2',
                                                                padding: '0 4px',
                                                                borderRadius: 3,
                                                                fontWeight: 700
                                                            }}
                                                        >
                                                            UQ
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.65rem',
                                                        color: isDarkPaper ? '#94a3b8' : '#64748b',
                                                        marginLeft: 6,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {col.type}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Table Footer (Exact 28px Height) */}
                                <div
                                    style={{
                                        height: FOOTER_HEIGHT,
                                        padding: '0 10px',
                                        background: isDarkPaper ? 'rgba(15, 23, 42, 0.65)' : '#f8fafc',
                                        borderTop: isDarkPaper ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '0.64rem',
                                        color: isDarkPaper ? '#94a3b8' : '#64748b',
                                        fontWeight: 600
                                    }}
                                >
                                    <span>InnoDB • 3NF</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {table.triggers && table.triggers.length > 0 && (
                                            <span style={{ color: '#d9480f', fontWeight: 700 }}>
                                                ⚡ {table.triggers.length} trg
                                            </span>
                                        )}
                                        {table.procedures && table.procedures.length > 0 && (
                                            <span style={{ color: '#0ca678', fontWeight: 700 }}>
                                                ⚙️ {table.procedures.length} sp
                                            </span>
                                        )}
                                        <span>{table.indexes.length} idx</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* --------------------------------------------------------------
                        4. APPLE NOTES STICKY CALLOUT CARDS ON CANVAS
                       -------------------------------------------------------------- */}
                    {showStickyNotes &&
                        stickyNotes.map(note => (
                            <div
                                key={note.id}
                                onPointerDown={(e) => handleStickyPointerDown(e, note.id)}
                                style={{
                                    position: 'absolute',
                                    left: note.x,
                                    top: note.y,
                                    width: note.width || 270,
                                    background: note.color,
                                    border: `1.5px solid ${note.border}`,
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.1)',
                                    transform: `rotate(${note.rotation || 0}deg)`,
                                    zIndex: 25,
                                    cursor: 'grab'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <input
                                        type="text"
                                        value={note.title}
                                        onChange={(e) =>
                                            setStickyNotes(prev =>
                                                prev.map(n => (n.id === note.id ? { ...n, title: e.target.value } : n))
                                            )
                                        }
                                        onPointerDown={(e) => e.stopPropagation()}
                                        style={{
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            color: '#0f172a',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            width: '88%'
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setStickyNotes(prev => prev.filter(n => n.id !== note.id));
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#64748b',
                                            padding: 2
                                        }}
                                        title="Remove Sticky Note"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <textarea
                                    value={note.text}
                                    onChange={(e) =>
                                        setStickyNotes(prev =>
                                            prev.map(n => (n.id === note.id ? { ...n, text: e.target.value } : n))
                                        )
                                    }
                                    onPointerDown={(e) => e.stopPropagation()}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        fontSize: '0.72rem',
                                        lineHeight: 1.4,
                                        color: '#334155',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        resize: 'none'
                                    }}
                                />
                            </div>
                        ))}
                </div>

                {/* ====================================================================
                    SELECTED RELATIONSHIP CONSTRAINT POPOVER PILL
                   ==================================================================== */}
                {selectedRel && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 112,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 45,
                            background: '#0f172a',
                            color: '#ffffff',
                            padding: '12px 18px',
                            borderRadius: 14,
                            boxShadow: '0 16px 36px rgba(0,0,0,0.28)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            maxWidth: 680
                        }}
                    >
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: selectedRel.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}
                        >
                            <Link2 size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{selectedRel.sourceTable}.{selectedRel.sourceCol}</span>
                                <span style={{ color: '#20c997' }}>──({selectedRel.cardinality} • {selectedRel.label})──▶</span>
                                <span>{selectedRel.targetTable}.{selectedRel.targetCol}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>
                                CONSTRAINT {selectedRel.id} • ON DELETE {selectedRel.onDelete} • JOIN {selectedRel.targetTable} ON {selectedRel.sourceTable}.{selectedRel.sourceCol} = {selectedRel.targetTable}.{selectedRel.targetCol}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedRelId(null)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                borderRadius: 8,
                                padding: 5,
                                cursor: 'pointer'
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* ====================================================================
                    BOTTOM-LEFT INTERACTIVE MINI-MAP & ZOOM HUD
                   ==================================================================== */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 18,
                        left: 18,
                        zIndex: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                    }}
                >
                    {/* Mini-Map Overview */}
                    <div
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = (e.clientX - rect.left) / rect.width;
                            const clickY = (e.clientY - rect.top) / rect.height;
                            const worldTargetX = clickX * 2100;
                            const worldTargetY = clickY * 2200;
                            const vp = viewportRef.current?.getBoundingClientRect();
                            if (vp) {
                                setCamera(prev => ({
                                    ...prev,
                                    x: vp.width / 2 - worldTargetX * prev.zoom,
                                    y: vp.height / 2 - worldTargetY * prev.zoom
                                }));
                            }
                        }}
                        title="Click anywhere on Mini-Map to jump across the 23-table notebook"
                        style={{
                            width: 185,
                            height: 132,
                            background: isDarkPaper ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(16px)',
                            border: isDarkPaper ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(15, 23, 42, 0.12)',
                            borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ position: 'absolute', top: 5, left: 8, fontSize: '0.6rem', fontWeight: 800, color: '#64748b', zIndex: 2 }}>
                            SCHEMA MINI-MAP (23)
                        </div>
                        {SCHEMA_TABLES.map(t => {
                            const p = tablePositions[t.id];
                            if (!p) return null;
                            const dom = domainMap[t.domain];
                            const mx = (p.x / 2100) * 185;
                            const my = (p.y / 2300) * 132;
                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        position: 'absolute',
                                        left: Math.max(4, Math.min(170, mx)),
                                        top: Math.max(14, Math.min(122, my)),
                                        width: 13,
                                        height: 8,
                                        borderRadius: 2,
                                        background: dom.color,
                                        opacity: selectedTableId === t.id ? 1 : 0.78,
                                        border: selectedTableId === t.id ? '1.5px solid #0f172a' : 'none'
                                    }}
                                />
                            );
                        })}
                    </div>

                    {/* Zoom Controls Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            background: isDarkPaper ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.92)',
                            backdropFilter: 'blur(16px)',
                            border: isDarkPaper ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(15, 23, 42, 0.1)',
                            padding: '5px 8px',
                            borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)'
                        }}
                    >
                        <button
                            onClick={() => zoomByStep(-0.12)}
                            title="Zoom Out (-)"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 5,
                                borderRadius: 7,
                                cursor: 'pointer',
                                color: isDarkPaper ? '#e2e8f0' : '#334155',
                                display: 'flex'
                            }}
                        >
                            <ZoomOut size={15} />
                        </button>

                        <span
                            onClick={() => setCamera(prev => ({ ...prev, zoom: 0.75 }))}
                            title="Click to set 75% zoom"
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                minWidth: 46,
                                textAlign: 'center',
                                cursor: 'pointer',
                                color: isDarkPaper ? '#f8fafc' : '#0f172a',
                                fontFamily: 'monospace'
                            }}
                        >
                            {Math.round(camera.zoom * 100)}%
                        </span>

                        <button
                            onClick={() => zoomByStep(0.12)}
                            title="Zoom In (+)"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 5,
                                borderRadius: 7,
                                cursor: 'pointer',
                                color: isDarkPaper ? '#e2e8f0' : '#334155',
                                display: 'flex'
                            }}
                        >
                            <ZoomIn size={15} />
                        </button>

                        <div style={{ width: 1, height: 16, background: '#cbd5e1', margin: '0 2px' }} />

                        <button
                            onClick={() => fitToScreen()}
                            title="Fit All 23 Tables in View (0)"
                            style={{
                                background: '#e6fcf5',
                                color: '#087f5b',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: 7,
                                cursor: 'pointer',
                                fontSize: '0.71rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            <Maximize2 size={12} />
                            <span>Fit All</span>
                        </button>

                        <button
                            onClick={() => handleApplySmartLayout(layoutMode)}
                            title="Reset Smart Arrangement"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 5,
                                borderRadius: 7,
                                cursor: 'pointer',
                                color: isDarkPaper ? '#e2e8f0' : '#475569',
                                display: 'flex'
                            }}
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* ====================================================================
                    BOTTOM-CENTER APPLE NOTES / FREEFORM SKETCH PENCIL DOCK
                   ==================================================================== */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isDarkPaper ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(22px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(22px) saturate(190%)',
                        border: isDarkPaper ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(15, 23, 42, 0.1)',
                        padding: '7px 12px',
                        borderRadius: 999,
                        boxShadow: '0 14px 34px rgba(15, 23, 42, 0.16)'
                    }}
                >
                    {[
                        { id: 'select', label: 'Move / Inspect (V)', icon: MousePointer },
                        { id: 'pan', label: 'Hand Pan (H)', icon: Hand },
                        { id: 'pen', label: 'Sketch Pen (P)', icon: PenTool },
                        { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
                        { id: 'note', label: 'Add Sticky Note', icon: StickyNote },
                        { id: 'eraser', label: 'Stroke Eraser', icon: Eraser }
                    ].map(tool => {
                        const Icon = tool.icon;
                        const active = activeTool === tool.id;
                        return (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                title={tool.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    borderRadius: 999,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: active ? 800 : 600,
                                    background: active ? '#0f172a' : 'transparent',
                                    color: active ? '#ffffff' : (isDarkPaper ? '#cbd5e1' : '#475569'),
                                    transition: 'all 140ms ease'
                                }}
                            >
                                <Icon size={14} />
                                <span>{tool.label.split(' (')[0]}</span>
                            </button>
                        );
                    })}

                    {/* Ink Color Swatches when Pen is selected */}
                    {activeTool === 'pen' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 6, borderLeft: '1px solid #cbd5e1' }}>
                            {['#1e293b', '#0ca678', '#e67700', '#1c7ed6', '#e03131', '#7950f2'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setInkColor(c)}
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        background: c,
                                        border: inkColor === c ? '2.5px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                                        boxShadow: inkColor === c ? `0 0 0 2px ${c}` : 'none',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {strokes.length > 0 && (
                        <button
                            onClick={() => setStrokes([])}
                            title="Clear All Ink Drawings"
                            style={{
                                background: '#ffe3e3',
                                color: '#c92a2a',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            <Trash2 size={12} />
                            <span>Clear Ink</span>
                        </button>
                    )}
                </div>

                {/* ====================================================================
                    RIGHT-SIDE TABLE INSPECTOR DRAWER (COLUMNS, FKs, DATA, SQL DDL)
                   ==================================================================== */}
                {selectedTable && (
                    <div
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            top: 68,
                            right: 16,
                            bottom: 18,
                            width: 380,
                            maxWidth: '92vw',
                            background: isDarkPaper ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                            backdropFilter: 'blur(24px)',
                            border: isDarkPaper ? '1px solid rgba(255,255,255,0.16)' : '1px solid #cbd5e1',
                            borderRadius: 18,
                            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)',
                            zIndex: 45,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            animation: 'slideLeft 180ms cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        {/* Inspector Header */}
                        <div
                            style={{
                                padding: '14px 16px',
                                background: domainMap[selectedTable.domain].color,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 800, opacity: 0.9 }}>
                                    <span>TABLE #{String(selectedTable.number).padStart(2, '0')}</span>
                                    <span>•</span>
                                    <span>{domainMap[selectedTable.domain].name}</span>
                                </div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>
                                    {selectedTable.name}
                                </h3>
                                <p style={{ fontSize: '0.73rem', opacity: 0.92, marginTop: 3, lineHeight: 1.35 }}>
                                    {selectedTable.comment}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedTableId(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    borderRadius: 8,
                                    padding: 5,
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Inspector Sub-Tabs */}
                        <div
                            style={{
                                display: 'flex',
                                borderBottom: isDarkPaper ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                background: isDarkPaper ? '#0f172a' : '#f8fafc'
                            }}
                        >
                            {[
                                { id: 'columns', label: `Columns (${selectedTable.columns.length})`, icon: Database },
                                { id: 'relations', label: 'Links & DB Objects', icon: GitCommit },
                                { id: 'data', label: `Sample Rows (${selectedTable.rowCount})`, icon: Table2 },
                                { id: 'ddl', label: 'SQL DDL', icon: Code2 }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const active = inspectorTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setInspectorTab(tab.id)}
                                        style={{
                                            flex: 1,
                                            padding: '9px 6px',
                                            border: 'none',
                                            borderBottom: active ? `2.5px solid ${domainMap[selectedTable.domain].color}` : '2.5px solid transparent',
                                            background: 'transparent',
                                            color: active ? domainMap[selectedTable.domain].color : '#64748b',
                                            fontSize: '0.71rem',
                                            fontWeight: active ? 800 : 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 4
                                        }}
                                    >
                                        <Icon size={12} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Inspector Body Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 14, color: isDarkPaper ? '#e2e8f0' : '#1e293b' }}>
                            {inspectorTab === 'columns' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {selectedTable.columns.map(col => (
                                        <div
                                            key={col.name}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: 9,
                                                border: isDarkPaper ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                                                background: isDarkPaper ? 'rgba(30,41,59,0.5)' : '#ffffff'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem' }}>
                                                    <span>{col.name}</span>
                                                    {col.isPK && <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>PK</span>}
                                                    {col.isFK && <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>FK</span>}
                                                    {col.isUnique && <span className="badge badge-purple" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>UNIQUE</span>}
                                                </div>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#0ca678', fontWeight: 700 }}>
                                                    {col.type}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.71rem', color: '#64748b', marginTop: 3 }}>
                                                {col.desc} {col.nullable ? '• NULLABLE' : '• NOT NULL'}
                                                {col.defaultVal ? ` • DEFAULT ${col.defaultVal}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {inspectorTab === 'relations' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {/* Outgoing Foreign Keys (Parents) */}
                                    <div>
                                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                                            References Parent Tables (Outgoing FKs)
                                        </div>
                                        {SCHEMA_RELATIONSHIPS.filter(r => r.sourceTable === selectedTable.id).length === 0 ? (
                                            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Root master table (no outgoing foreign keys).</div>
                                        ) : (
                                            SCHEMA_RELATIONSHIPS.filter(r => r.sourceTable === selectedTable.id).map(r => (
                                                <div
                                                    key={r.id}
                                                    onClick={() => focusTableOnCanvas(r.targetTable)}
                                                    style={{
                                                        padding: '8px 10px',
                                                        borderRadius: 8,
                                                        border: '1px solid #e2e8f0',
                                                        marginBottom: 6,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        background: isDarkPaper ? '#1e293b' : '#f8fafc'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                                            {r.sourceCol} → <span style={{ color: '#0ca678' }}>{r.targetTable}.{r.targetCol}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                            {r.id} • ON DELETE {r.onDelete} ({r.cardinality})
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} color="#64748b" />
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Incoming Foreign Keys (Children) */}
                                    <div>
                                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                                            Referenced By Child Tables (Incoming FKs)
                                        </div>
                                        {SCHEMA_RELATIONSHIPS.filter(r => r.targetTable === selectedTable.id).length === 0 ? (
                                            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Leaf table (no child tables reference this PK).</div>
                                        ) : (
                                            SCHEMA_RELATIONSHIPS.filter(r => r.targetTable === selectedTable.id).map(r => (
                                                <div
                                                    key={r.id}
                                                    onClick={() => focusTableOnCanvas(r.sourceTable)}
                                                    style={{
                                                        padding: '8px 10px',
                                                        borderRadius: 8,
                                                        border: '1px solid #e2e8f0',
                                                        marginBottom: 6,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        background: isDarkPaper ? '#1e293b' : '#f8fafc'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                                            <span style={{ color: '#1c7ed6' }}>{r.sourceTable}.{r.sourceCol}</span> → {r.targetCol}
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                            {r.id} • "{r.label}" ({r.cardinality})
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} color="#64748b" />
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Indexes, Checks, Triggers & Stored Procedures */}
                                    <div>
                                        <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                                            Indexes ({selectedTable.indexes.length}) & Constraints
                                        </div>
                                        {selectedTable.indexes.map((idx, i) => (
                                            <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'monospace', padding: '4px 0', color: '#475569' }}>
                                                • {idx}
                                            </div>
                                        ))}
                                        {selectedTable.checks.map((chk, i) => (
                                            <div key={i} style={{ fontSize: '0.71rem', fontFamily: 'monospace', padding: '4px 0', color: '#d9480f' }}>
                                                ✓ CHECK ({chk})
                                            </div>
                                        ))}
                                    </div>

                                    {(selectedTable.triggers?.length > 0 || selectedTable.procedures?.length > 0 || selectedTable.views?.length > 0) && (
                                        <div>
                                            <div style={{ fontSize: '0.73rem', fontWeight: 800, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
                                                Connected Triggers, Procedures & Views
                                            </div>
                                            {selectedTable.triggers?.map(trg => (
                                                <div key={trg} style={{ fontSize: '0.73rem', color: '#d9480f', fontWeight: 600, marginBottom: 3 }}>
                                                    ⚡ Trigger: {trg}
                                                </div>
                                            ))}
                                            {selectedTable.procedures?.map(sp => (
                                                <div key={sp} style={{ fontSize: '0.73rem', color: '#0ca678', fontWeight: 600, marginBottom: 3 }}>
                                                    ⚙️ Procedure: {sp}
                                                </div>
                                            ))}
                                            {selectedTable.views?.map(vw => (
                                                <div key={vw} style={{ fontSize: '0.73rem', color: '#7950f2', fontWeight: 600, marginBottom: 3 }}>
                                                    👁️ View: {vw}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {inspectorTab === 'data' && (
                                <div>
                                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 10 }}>
                                        Showing seed records from <code>04_sample_data.sql</code> ({selectedTable.rowCount} total rows in DB):
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {selectedTable.sampleRows.map((row, rIdx) => (
                                            <div
                                                key={rIdx}
                                                style={{
                                                    padding: 10,
                                                    borderRadius: 9,
                                                    background: isDarkPaper ? '#1e293b' : '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '0.73rem',
                                                    fontFamily: 'monospace'
                                                }}
                                            >
                                                {Object.entries(row).map(([k, v]) => (
                                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                                                        <span style={{ color: '#64748b' }}>{k}:</span>
                                                        <span style={{ fontWeight: 700, color: isDarkPaper ? '#f8fafc' : '#0f172a', textAlign: 'right' }}>
                                                            {v === null ? 'NULL' : String(v)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {inspectorTab === 'ddl' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#64748b' }}>
                                            02_create_tables.sql Definition
                                        </span>
                                        <button
                                            onClick={handleCopyDDL}
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: '4px 10px', fontSize: '0.72rem', gap: 5 }}
                                        >
                                            {copiedDDL ? <Check size={12} color="#0ca678" /> : <Copy size={12} />}
                                            <span>{copiedDDL ? 'Copied!' : 'Copy SQL'}</span>
                                        </button>
                                    </div>
                                    <pre
                                        style={{
                                            background: '#0f172a',
                                            color: '#e2e8f0',
                                            padding: 12,
                                            borderRadius: 10,
                                            fontSize: '0.71rem',
                                            lineHeight: 1.5,
                                            overflowX: 'auto',
                                            fontFamily: 'monospace'
                                        }}
                                    >
                                        {generateTableDDL(selectedTable)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

