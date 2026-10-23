// The band as status-pills 0.5.0 drew it, recorded at 516d3a8 from that
// version's code under the engine of band.test.tsx: a session past one `high`
// response on a warm cache, drawn on the terminal at 200 columns, at 80, before
// the terminal measured, and on the desktop. A terminal that draws no pictures
// must still draw exactly this
export const RELEASE_0_5_0 = {
  "terminal": {
    "wide":
      {"type": "Box", "props": {"flexDirection": "column"}, "part": {"plugin": "status-pills"}, "children": [
        {"type": "Text", "children": ["⏵⏵ auto mode on (shift+tab to cycle)"], "part": {"plugin": "test"}},
        {"type": "Box", "props": {"flexDirection": "row", "flexWrap": "wrap", "justifyContent": "flex-start", "columnGap": 1, "marginTop": 1}, "children": [
          {"type": "Box", "props": {"key": "model", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": true, "backgroundColor": "#303030"}, "children": [" Opus 5.5"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" high"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "context", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" ctx"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 23%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "five-hour", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 5h"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 48%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 2h54"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "seven-day", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 7D"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 52%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 11/10 19h"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "project", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [" painel-agents-mod"]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" main"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "cache", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": true, "backgroundColor": "#303030"}, "children": [" 60m"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": false, "backgroundColor": "#303030"}, "children": [" 95%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]}
        ]}
      ]},
    "narrow":
      {"type": "Box", "props": {"flexDirection": "column"}, "part": {"plugin": "status-pills"}, "children": [
        {"type": "Text", "children": ["⏵⏵ auto mode on (shift+tab to cycle)"], "part": {"plugin": "test"}},
        {"type": "Box", "props": {"flexDirection": "row", "flexWrap": "wrap", "justifyContent": "center", "columnGap": 1, "marginTop": 1}, "children": [
          {"type": "Box", "props": {"key": "model", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": true, "backgroundColor": "#303030"}, "children": [" Opus 5.5"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" high"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "context", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" ctx"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 23%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "five-hour", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 5h"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 48%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 2h54"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "seven-day", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 7D"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 52%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 11/10 19h"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "project", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [" painel-agents-mod"]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" main"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "cache", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": true, "backgroundColor": "#303030"}, "children": [" 60m"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": false, "backgroundColor": "#303030"}, "children": [" 95%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]}
        ]}
      ]},
    "unmeasured":
      {"type": "Box", "props": {"flexDirection": "column"}, "part": {"plugin": "status-pills"}, "children": [
        {"type": "Text", "children": ["⏵⏵ auto mode on (shift+tab to cycle)"], "part": {"plugin": "test"}},
        {"type": "Box", "props": {"flexDirection": "row", "flexWrap": "wrap", "justifyContent": "flex-start", "columnGap": 1, "marginTop": 1}, "children": [
          {"type": "Box", "props": {"key": "model", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#c6a0f6", "bold": true, "backgroundColor": "#303030"}, "children": [" Opus 5.5"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" high"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "context", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" ctx"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 23%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "five-hour", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 5h"]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 48%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 2h54"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "seven-day", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#939ab7", "bold": false, "backgroundColor": "#303030"}, "children": [" 7D"]},
            {"type": "Text", "props": {"color": "#eed49f", "bold": false, "backgroundColor": "#303030"}, "children": [" ▓▓▓"]},
            {"type": "Text", "props": {"color": "#585858", "bold": false, "backgroundColor": "#303030"}, "children": ["▓▓▓"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": true, "backgroundColor": "#303030"}, "children": [" 52%"]},
            {"type": "Text", "props": {"color": "#626262", "bold": false, "backgroundColor": "#303030"}, "children": [" │"]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#b8c0e0", "bold": false, "backgroundColor": "#303030"}, "children": [" 11/10 19h"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "project", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#33dd2d", "bold": false, "backgroundColor": "#303030"}, "children": [" painel-agents-mod"]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#3a86ff", "bold": false, "backgroundColor": "#303030"}, "children": [" main"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]},
          {"type": "Box", "props": {"key": "cache", "flexDirection": "row", "flexShrink": 0}, "children": [
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#8aadf4", "bold": false, "backgroundColor": "#303030"}, "children": [""]},
            {"type": "Text", "props": {"color": "#a6da95", "bold": true, "backgroundColor": "#303030"}, "children": [" 60m"]},
            {"type": "Text", "props": {"color": "#cad3f5", "bold": false, "backgroundColor": "#303030"}, "children": [" 95%"]},
            {"type": "Text", "props": {"color": "#303030", "bold": false, "backgroundColor": "#303030"}, "children": [" "]},
            {"type": "Text", "props": {"color": "#303030", "bold": false}, "children": [""]}
          ]}
        ]}
      ]}
  },
  "desktop":
    {"type": "Box", "props": {"flexDirection": "column"}, "part": {"plugin": "status-pills"}, "children": [
      {"type": "engine", "ref": 0},
      {"type": "Box", "props": {"flexDirection": "column", "alignItems": "flex-start"}, "children": [
        {"type": "Box", "props": {"flexDirection": "row", "flexWrap": "wrap", "justifyContent": "center", "columnGap": 1}, "children": [
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"113\" height=\"26\" viewBox=\"0 -2 113 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#3b0b76}.c1{color:#765615}@media (prefers-color-scheme: dark){.c0{color:#c6a0f6}.c1{color:#eed49f}}</style><rect x=\"0.5\" y=\"0.5\" width=\"112\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M4.5 3.5h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zM5.5 1.5v2M7.5 1.5v2M5.5 9.5v2M7.5 9.5v2M1.5 5.5h2M1.5 7.5h2M9.5 5.5h2M9.5 7.5h2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c0\" x=\"27\" y=\"15.2\" fill=\"currentColor\" font-weight=\"600\" textLength=\"49.5\" lengthAdjust=\"spacingAndGlyphs\">Opus 5.5</text><text class=\"c1\" x=\"81.5\" y=\"15.2\" fill=\"currentColor\" textLength=\"22\" lengthAdjust=\"spacingAndGlyphs\">high</text></svg>", "alt": "Opus 5.5 high", "width": 113, "height": 26}},
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"146\" height=\"26\" viewBox=\"0 -2 146 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#0d378c}.c1{color:#525a7b}.c2{color:#407d2c}.c3{color:#101f56}@media (prefers-color-scheme: dark){.c0{color:#8aadf4}.c1{color:#939ab7}.c2{color:#a6da95}.c3{color:#cad3f5}}</style><rect x=\"0.5\" y=\"0.5\" width=\"145\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M2 2.5h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6l-2.5 2v-2H2a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c1\" x=\"27\" y=\"15.2\" fill=\"currentColor\" textLength=\"18.7\" lengthAdjust=\"spacingAndGlyphs\">ctx</text><rect x=\"50.7\" y=\"8\" width=\"56\" height=\"6\" rx=\"3\" fill=\"#808080\" fill-opacity=\"0.25\"/><rect class=\"c2\" x=\"50.7\" y=\"8\" width=\"12.9\" height=\"6\" rx=\"3\" fill=\"currentColor\"/><text class=\"c3\" x=\"111.7\" y=\"15.2\" fill=\"currentColor\" font-weight=\"600\" textLength=\"25.2\" lengthAdjust=\"spacingAndGlyphs\">23%</text></svg>", "alt": "ctx 23%", "width": 146, "height": 26}},
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"26\" viewBox=\"0 -2 200 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#0d378c}.c1{color:#525a7b}.c2{color:#407d2c}.c3{color:#101f56}.c4{color:#273159}@media (prefers-color-scheme: dark){.c0{color:#8aadf4}.c1{color:#939ab7}.c2{color:#a6da95}.c3{color:#cad3f5}.c4{color:#b8c0e0}}</style><rect x=\"0.5\" y=\"0.5\" width=\"199\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M1.8 9.5a4.9 4.9 0 1 1 9.4 0M6.5 8.2l2.4-2.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c1\" x=\"27\" y=\"15.2\" fill=\"currentColor\" textLength=\"13\" lengthAdjust=\"spacingAndGlyphs\">5h</text><rect x=\"45\" y=\"8\" width=\"56\" height=\"6\" rx=\"3\" fill=\"#808080\" fill-opacity=\"0.25\"/><rect class=\"c2\" x=\"45\" y=\"8\" width=\"26.9\" height=\"6\" rx=\"3\" fill=\"currentColor\"/><text class=\"c3\" x=\"106\" y=\"15.2\" fill=\"currentColor\" font-weight=\"600\" textLength=\"25.2\" lengthAdjust=\"spacingAndGlyphs\">48%</text><line x1=\"138.6\" y1=\"6\" x2=\"138.6\" y2=\"16\" stroke=\"#5b6078\" stroke-opacity=\"0.45\"/><path class=\"c4\" transform=\"translate(146.1 4.5)\" d=\"M2.2 6.5a4.3 4.3 0 1 0 1.3-3.1M1.8 1.8v2.4h2.4M6.5 4.3v2.4l1.7 1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c4\" x=\"164.1\" y=\"15.2\" fill=\"currentColor\" textLength=\"26.4\" lengthAdjust=\"spacingAndGlyphs\">2h54</text></svg>", "alt": "5h 48% | 2h54", "width": 200, "height": 26}},
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"231\" height=\"26\" viewBox=\"0 -2 231 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#0d378c}.c1{color:#525a7b}.c2{color:#765615}.c3{color:#101f56}.c4{color:#273159}@media (prefers-color-scheme: dark){.c0{color:#8aadf4}.c1{color:#939ab7}.c2{color:#eed49f}.c3{color:#cad3f5}.c4{color:#b8c0e0}}</style><rect x=\"0.5\" y=\"0.5\" width=\"230\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M3 2.5h7a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 10V4A1.5 1.5 0 0 1 3 2.5zM1.5 5.5h10M4.5 1v3M8.5 1v3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c1\" x=\"27\" y=\"15.2\" fill=\"currentColor\" textLength=\"14.6\" lengthAdjust=\"spacingAndGlyphs\">7D</text><rect x=\"46.6\" y=\"8\" width=\"56\" height=\"6\" rx=\"3\" fill=\"#808080\" fill-opacity=\"0.25\"/><rect class=\"c2\" x=\"46.6\" y=\"8\" width=\"29.1\" height=\"6\" rx=\"3\" fill=\"currentColor\"/><text class=\"c3\" x=\"107.6\" y=\"15.2\" fill=\"currentColor\" font-weight=\"600\" textLength=\"25.2\" lengthAdjust=\"spacingAndGlyphs\">52%</text><line x1=\"140.3\" y1=\"6\" x2=\"140.3\" y2=\"16\" stroke=\"#5b6078\" stroke-opacity=\"0.45\"/><path class=\"c4\" transform=\"translate(147.8 4.5)\" d=\"M2.2 6.5a4.3 4.3 0 1 0 1.3-3.1M1.8 1.8v2.4h2.4M6.5 4.3v2.4l1.7 1\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c4\" x=\"165.8\" y=\"15.2\" fill=\"currentColor\" textLength=\"56.2\" lengthAdjust=\"spacingAndGlyphs\">11/10 19h</text></svg>", "alt": "7D 52% | 11/10 19h", "width": 231, "height": 26}},
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"190\" height=\"26\" viewBox=\"0 -2 190 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#26c620}.c1{color:#0056df}@media (prefers-color-scheme: dark){.c0{color:#33dd2d}.c1{color:#3a86ff}}</style><rect x=\"0.5\" y=\"0.5\" width=\"189\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M1.5 3.5a1 1 0 0 1 1-1h2.8l1.2 1.5h4.5a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-8.5a1 1 0 0 1-1-1z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c0\" x=\"27\" y=\"15.2\" fill=\"currentColor\" textLength=\"104.2\" lengthAdjust=\"spacingAndGlyphs\">painel-agents-mod</text><path class=\"c1\" transform=\"translate(136.2 4.5)\" d=\"M2.6 2.9a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M2.6 10.1a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M7.6 3.8a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0M4 4.3v4.4M9 5.2c0 2-5 1.5-5 3.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c1\" x=\"154.2\" y=\"15.2\" fill=\"currentColor\" textLength=\"26\" lengthAdjust=\"spacingAndGlyphs\">main</text></svg>", "alt": "painel-agents-mod main", "width": 190, "height": 26}},
          {"type": "Svg", "props": {"source": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"90\" height=\"26\" viewBox=\"0 -2 90 26\"><style>text{font-family:system-ui, -apple-system, \"Segoe UI\", sans-serif;font-size:12px}.c0{color:#0d378c}.c1{color:#407d2c}.c2{color:#101f56}@media (prefers-color-scheme: dark){.c0{color:#8aadf4}.c1{color:#a6da95}.c2{color:#cad3f5}}</style><rect x=\"0.5\" y=\"0.5\" width=\"89\" height=\"21\" rx=\"10.5\" fill=\"#5b6078\" fill-opacity=\"0.12\" stroke=\"#5b6078\" stroke-opacity=\"0.5\"/><path class=\"c0\" transform=\"translate(9 4.5)\" d=\"M2 3a4.5 1.6 0 1 0 9 0a4.5 1.6 0 1 0-9 0M2 3v7a4.5 1.6 0 0 0 9 0V3M2 6.5a4.5 1.6 0 0 0 9 0\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text class=\"c1\" x=\"27\" y=\"15.2\" fill=\"currentColor\" font-weight=\"600\" textLength=\"25.2\" lengthAdjust=\"spacingAndGlyphs\">60m</text><text class=\"c2\" x=\"57.2\" y=\"15.2\" fill=\"currentColor\" textLength=\"23.8\" lengthAdjust=\"spacingAndGlyphs\">95%</text></svg>", "alt": "60m 95%", "width": 90, "height": 26}}
        ]}
      ]}
    ]}
}
