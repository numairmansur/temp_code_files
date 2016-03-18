data <- iris
data$Species <- NULL
kc <- kmeans(data,5)
x <- iris
list <- kc$cluster
d <- cbind(x,list)
sorted <- d[order(d[6]), ]
d3heatmap(sorted[1:4], dendrogram = "none")
