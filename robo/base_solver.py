'''
Created on Aug 21, 2015

@author: Aaron Klein
'''

import os
import csv
import time
import errno
import logging
import json

logger = logging.getLogger(__name__)


class BaseSolver(object):

    def __init__(self, acquisition_func=None, model=None,
                 maximize_func=None, task=None, save_dir=None):
        """
        Base class which specifies the interface for solvers. Derive from
        this class if you implement your own solver.

        Parameters
        ----------
        acquisition_func: AcquisitionFunctionObject
            The acquisition function which will be maximized.
        model: ModelObject
            Model (i.e. GaussianProcess, RandomForest) that models our current
            believe of the objective function.
        task: TaskObject
            Task object that contains the objective function and additional
            meta information such as the lower and upper bound of the search
            space.
        maximize_func: MaximizerObject
            Optimization method that is used to maximize the acquisition
            function
        save_dir: String
            Output path
        """

        self.model = model
        self.acquisition_func = acquisition_func
        self.maximize_func = maximize_func
        self.task = task
        self.save_dir = save_dir
        if self.save_dir is not None:
            self.create_save_dir()

    def create_save_dir(self):
        """
        Creates the save directory to store the runs
        """
        try:
            os.makedirs(self.save_dir)
        except OSError as exception:
            if exception.errno != errno.EEXIST:
                raise
        self.output_file = open(os.path.join(self.save_dir, 'results.csv'), 'w')
        self.output_file_json = open(os.path.join(self.save_dir, 'results.json'), 'w')
        self.csv_writer = None
        self.json_writer =None

    def get_observations(self):
        return self.X, self.Y

    def get_model(self):
        if self.model is None:
            logger.info("No model trained yet!")
        return self.model

    def run(self, num_iterations=10, X=None, Y=None, overwrite=False):
        """
        The main optimization loop

        Parameters
        ----------
        num_iterations: int
            The number of iterations
        X: np.ndarray(N,D)
            Initial points that are already evaluated
        Y: np.ndarray(N,1)
            Function values of the already evaluated points

        Returns
        -------
        np.ndarray(1,D)
            Incumbent
        np.ndarray(1,1)
            (Estimated) function value of the incumbent
        """
        pass

    def choose_next(self, X=None, Y=None):
        """
        Suggests a new point to evaluate.

        Parameters
        ----------
        num_iterations: int
            The number of iterations
        X: np.ndarray(N,D)
            Initial points that are already evaluated
        Y: np.ndarray(N,1)
            Function values of the already evaluated points

        Returns
        -------
        np.ndarray(1,D)
            Suggested point
        """
        pass

    def save_iteration(self, it, **kwargs):
        """
        Saves the meta information of an iteration.
        """
        print(" - - Entered Save_Iteration CSV method - - ");
        if self.csv_writer is None:
            self.fieldnames = ['iteration', 'config', 'fval',
                               'incumbent', 'incumbent_val',
                               'time_func_eval', 'time_overhead', 'runtime']

            for key in kwargs:
                self.fieldnames.append(key)
            self.csv_writer = csv.DictWriter(self.output_file,
                                             fieldnames=self.fieldnames)
            self.csv_writer.writeheader()

        output = dict()
        output["iteration"] = it
        output['config'] = self.X[-1]
        output['fval'] = self.Y[-1]
        output['incumbent'] = self.incumbent
        output['incumbent_val'] = self.incumbent_value
        output['time_func_eval'] = self.time_func_eval[-1]
        output['time_overhead'] = self.time_overhead[-1]
        output['runtime'] = time.time() - self.time_start


        if kwargs is not None:
            for key, value in kwargs.items():
                output[key] = str(value)
        print("Dumping in CSV FILE")
        print(output)

        self.csv_writer.writerow(output)
        self.output_file.flush()


    def save_json(self, it, **kwargs):
    	"""
    	Saves the meta information of an iteration in a Json file
    	"""
    	print(" - - Entered Save_Json File - - -")

        if self.json_writer is None:
            self.fieldnames = ['iteration', 'config', 'fval',
                               'incumbent', 'incumbent_val',
                               'time_func_eval', 'time_overhead', 'runtime']

            for key in kwargs:
                self.fieldnames.append(key)
        output = dict()
        output["iteration"] = it
        output['config'] = self.X[-1].tolist() #Json dump cant handle numpy arrays,
        output['fval'] = self.Y[-1].tolist()   # So we have to convert them to list.
        output['incumbent'] = self.incumbent.tolist()
        output['incumbent_val'] = self.incumbent_value.tolist()
        output['time_func_eval'] = self.time_func_eval[-1]
        output['time_overhead'] = self.time_overhead[-1]
        output['runtime'] = time.time() - self.time_start


        if kwargs is not None:
            for key, value in kwargs.items():
                output[key] = str(value)

        print("Going to write this into JSON")
        print(output)
        json.dump(output,self.output_file_json)


    def load_json(self):
    	""" 
    	Loads the data from a Json file
    	"""

    	print(" --- Entered Load Json File - - - ")

    	# which element to load ?
    	# maybe load them all and save them in an array
    	# and you can access each element by just the index of the array
