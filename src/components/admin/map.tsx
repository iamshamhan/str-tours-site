"use client";
import dynamic from "next/dynamic";
export type MapPoint={id:string;label:string;latitude:number;longitude:number};
export type EditorMapProps={points:MapPoint[];colour?:string;onPosition?:(latitude:number,longitude:number)=>void};
export const EditorMap=dynamic<EditorMapProps>(()=>import("./map-canvas"),{ssr:false,loading:()=> <p>Loading map…</p>});
