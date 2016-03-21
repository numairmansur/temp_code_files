import numpy as np
import math
import matplotlib.pyplot as plt


def plt_mean_std(
        x,
        curves,
        title="",
        colors=['b', 'g', 'r', 'c', 'm', 'y', 'k'],
        log_scale_y=False,
        log_scale_x=False,
        legend=True):
    '''
    Plots Mean and Standard Deviation with an error bar graph

    Parameters
    ----------
    x : numpy array
    	For each curve, contains the x-coordinates. Each entry 
    	corresponds to one curve.
    curves : list of numpy arrays 
    	A list of 2D numpy arrays of mean and standard deviation. First entry in the
    	numpy array corresponds to the mean and the second entry corresponds to the
    	error. Each entry in the curves list corresponds to one curve.
    title : string
    	Title of the graph
    colors : string array
    	Color of the curve. Each entry corresponds to one curve
    log_scale_y : Boolean
    	If set to true, changes the y-axis to log scale.
    log_scale_x: Boolean
    	If set to true, change the x-axis to log scale.
    legend : Boolean
    	If set to true, displays the legend.
    '''
    plt.figure()
    for i, j in enumerate(x):
        plt.errorbar(j,
                     curves[i][0],
                     yerr=curves[i][1],
                     fmt='o',
                     label='curve' + str(i + 1),
                     color=colors[i])
    plt.title(title)
    plt.grid()
    if log_scale_x:
        plt.xscale('log')
    if log_scale_y:
        plt.yscale('log')
    if legend:
        plt.legend()

    # Adjust Margins    
    plot_margin = 0.25
    x0, x1, y0, y1 = plt.axis()
    plt.axis((x0 - plot_margin,
              x1 + plot_margin,
              y0 - plot_margin,
              y1 + plot_margin))
    plt.show()


# Example.
x = np.array([[1, 2, 3, 4], [2, 3, 4, 5], [1, 3, 6, 9], [4, 5, 6, 7]])
curve1 = np.array([[1, 4, 5, 7], [1, 0.4, 0.7, 0.4]])
curve2 = np.array([[0.9, 1, 0.7, 0.9], [3, 4, 6, 8]])
curve3 = np.array([[1.9, -1.1, 2.7, 0.4], [1, 6, 8, 10]])
curve4 = np.array([[4, 3, 2, 1], [1, 1, 1, 1]])
curves = [curve1, curve2, curve3, curve4]
plt_mean_std(x, curves)
