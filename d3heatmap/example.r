library(d3heatmap)
data <- iris
data$Species <- NULL
kc <- kmeans(data,5)
x <- iris
list <- kc$cluster
d <- cbind(x,list)
sorted <- d[order(d[6]), ]
d3heatmap(sorted[-5],owncluster = sorted[6],dendrogram = "row")



require(ctc) ## hclust to Newick format 
col_dend <- hc2Newick(hclust(dist(t(data[1:4]))))
row_dend <- hc2Newick(hclust(dist(data[1:4])))
