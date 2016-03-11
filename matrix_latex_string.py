\documentclass{article}

\begin{document}
\begin{center}


\begin{tabular}
{ |c|c|c| }
\hline 
$1{\scriptstyle \pm 2}$ & $1{\scriptstyle \pm 6}$ & $5{\scriptstyle \pm 1}$ \\ \hline
$2{\scriptstyle \pm 4}$ & $7{\scriptstyle \pm 8}$ & $6{\scriptstyle \pm 2}$ \\ \hline
$2{\scriptstyle \pm 1}$ & $7{\scriptstyle \pm 4}$ & $7{\scriptstyle \pm 8}$ \\ \hline
\end{tabular}
\end{center}

\begin{table}[ht]
\caption{Some Title} % title of Table
\centering % used for centering table
\begin{tabular}{c c c c} % centered columns (4 columns)
\\[-2ex]
\hline\hline  %inserts double horizontal lines
\\[-2ex]
 & \textbf{Column} & \textbf{Column} & \textbf{Column} \\ [0.1ex] % inserts table
%heading
%\hline % inserts single horizontal line
\\[-2ex]
\textbf{Row} & $1 \pm 2$ & $\mathbf{1 \pm 2}$ & $1 \pm 2$ \\ % inserting body of the table
\textbf{Row} & $1 \pm 2$ & $1 \pm 2$ & $\mathbf{1 \pm 2}$ \\
\textbf{Row} & $\mathbf{1 \pm 2}$ & $1 \pm 2$ & $1 \pm 2$ \\
\textbf{Row} & $1 \pm 2$ & $\mathbf{1 \pm 2}$ & $1 \pm 2$ \\
\textbf{Row} & $\mathbf{1 \pm 2}$ & $1 \pm 2$ & $1 \pm 2$ \\ [1ex] % [1ex] adds vertical space
\hline %inserts single line
\end{tabular}
\label{table:nonlin} % is used to refer this table in the text
\end{table}
		
\end{document}
