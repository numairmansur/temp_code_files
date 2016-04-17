/*
 * Copyright (C) 2015 Matthias Heizmann (heizmann@informatik.uni-freiburg.de)
 * Copyright (C) 2015 University of Freiburg
 * 
 * This file is part of the ULTIMATE TraceAbstraction plug-in.
 * 
 * The ULTIMATE TraceAbstraction plug-in is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * The ULTIMATE TraceAbstraction plug-in is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with the ULTIMATE TraceAbstraction plug-in. If not, see <http://www.gnu.org/licenses/>.
 * 
 * Additional permission under GNU GPL version 3 section 7:
 * If you modify the ULTIMATE TraceAbstraction plug-in, or any covered work, by linking
 * or combining it with Eclipse RCP (or a modified version of Eclipse RCP), 
 * containing parts covered by the terms of the Eclipse Public License, the 
 * licensors of the ULTIMATE TraceAbstraction plug-in grant you additional permission 
 * to convey the resulting work.
 */
package de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.apache.log4j.Logger;

import de.uni_freiburg.informatik.ultimate.access.WalkerOptions.State;
import de.uni_freiburg.informatik.ultimate.automata.AutomataLibraryServices;
import de.uni_freiburg.informatik.ultimate.automata.IRun;
import de.uni_freiburg.informatik.ultimate.automata.OperationCanceledException;
import de.uni_freiburg.informatik.ultimate.automata.nwalibrary.INestedWordAutomaton;
import de.uni_freiburg.informatik.ultimate.automata.nwalibrary.NestedRun;
import de.uni_freiburg.informatik.ultimate.automata.nwalibrary.NestedWord;
import de.uni_freiburg.informatik.ultimate.automata.nwalibrary.operations.IsEmpty;
import de.uni_freiburg.informatik.ultimate.automata.nwalibrary.transitions.OutgoingInternalTransition;
import de.uni_freiburg.informatik.ultimate.core.services.model.IUltimateServiceProvider;
import de.uni_freiburg.informatik.ultimate.logic.Annotation;
import de.uni_freiburg.informatik.ultimate.logic.Script.LBool;
import de.uni_freiburg.informatik.ultimate.logic.Term;
import de.uni_freiburg.informatik.ultimate.logic.Util;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.boogie.ModifiableGlobalVariableManager;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.boogie.TransFormula;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.BasicCallAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.BasicInternalAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.BasicReturnAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.IAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.ICallAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.IInternalAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.cfg.IReturnAction;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.smt.SmtUtils;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.smt.normalForms.Cnf;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.smt.predicates.BasicPredicate;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.smt.predicates.IPredicate;
import de.uni_freiburg.informatik.ultimate.plugins.generator.rcfgbuilder.cfg.CodeBlock;
import de.uni_freiburg.informatik.ultimate.plugins.generator.rcfgbuilder.cfg.CodeBlockFactory;
import de.uni_freiburg.informatik.ultimate.plugins.generator.rcfgbuilder.cfg.ProgramPoint;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.FaultLocalizationRelevanceChecker;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.FaultLocalizationRelevanceChecker.ERelevanceStatus;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.IterativePredicateTransformer;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.PredicateTransformer;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.SmtManager;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.singleTraceCheck.DefaultTransFormulas;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.singleTraceCheck.NestedFormulas;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.singleTraceCheck.NestedSsaBuilder;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.singleTraceCheck.PredicateUnifier;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.singleTraceCheck.TraceCheckerUtils.InterpolantsPreconditionPostcondition;
import de.uni_freiburg.informatik.ultimate.result.IRelevanceInformation;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.RelevanceInformation;
import de.uni_freiburg.informatik.ultimate.util.ToolchainCanceledException;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.ISLPredicate;
/**
 * 
 * @author Numair Mansur
 * @author Matthias Heizmann
 * @author Christian Schilling
 * 
 *
 */
public class FlowSensitiveFaultLocalizer {

	private IUltimateServiceProvider m_Services;
	private final Logger m_Logger;
	private ArrayList<IRelevanceInformation> Relevance_of_statements = new ArrayList<>(); 

	public FlowSensitiveFaultLocalizer(IRun<CodeBlock, IPredicate> counterexample,
			INestedWordAutomaton<CodeBlock, IPredicate> cfg, IUltimateServiceProvider services, SmtManager smtManager,
			ModifiableGlobalVariableManager modGlobVarManager, PredicateUnifier predicateUnifier) {
		m_Services = services;
		m_Logger = m_Services.getLoggingService().getLogger(Activator.s_PLUGIN_ID);
		ArrayList<int[]> informationFromCFG = computeInformationFromCFG( (NestedRun<CodeBlock, IPredicate>) counterexample, cfg); //Get branch information. in the form of an array list
		makeRelevanceObjects(counterexample);
		computeNONFlowSensitiveTraceFormula(counterexample, predicateUnifier.getFalsePredicate(), modGlobVarManager, smtManager);
		computeFlowSensitiveTraceFormula(counterexample, predicateUnifier.getFalsePredicate(), modGlobVarManager, smtManager,informationFromCFG);
	}
	private void makeRelevanceObjects(IRun<CodeBlock, IPredicate> counterexampleRun)
	{
		NestedWord<CodeBlock> counterexampleWord = (NestedWord<CodeBlock>) counterexampleRun.getWord();
		for(int i = 0; i<counterexampleWord.length(); i++)
		{
			IRelevanceInformation relevancy_of_statement = new RelevanceInformation();
			((RelevanceInformation) relevancy_of_statement).setStatement(counterexampleWord.getSymbolAt(i));
			Relevance_of_statements.add(relevancy_of_statement);
		}
		
	}

	private ArrayList<int[]> computeInformationFromCFG(NestedRun<CodeBlock, IPredicate> counterexample,
			INestedWordAutomaton<CodeBlock, IPredicate> cfg) 
	{
		m_Logger.warn("Computing Graph Information . . . . ");
		int size = counterexample.getStateSequence().size();
		ArrayList<int[]> result = new ArrayList<>();
		ArrayList<IPredicate> counter_example_states = counterexample.getStateSequence();
		ArrayList<IPredicate> cfg_states = new ArrayList<IPredicate>(cfg.getStates());
		// Create a Map of Program_points in the CFG to States of the CFG.
		Map <ProgramPoint,IPredicate> hashmap = new HashMap<>();
		for(int i=0; i < cfg_states.size(); i++)
		{
			IPredicate state = cfg_states.get(i);
			ISLPredicate Isl_state  =(ISLPredicate) state;
			ProgramPoint program_point = Isl_state.getProgramPoint();
			hashmap.put(program_point,state);
		}
		
		//program_point.getProgramPoint();
		ArrayList<IPredicate> a = new ArrayList<IPredicate>(cfg.getStates());
		ISLPredicate c = (ISLPredicate) a.get(0);
		c.getProgramPoint();
		
		ISLPredicate d = null;
		//Set<IPredicate> a = cfg.getStates();
		IPredicate start_state = null;
		ProgramPoint programpoint = null;
		// For each state find out if it's a branch or not.
		// For each state, find out if there is an outgoing branch from that state
		// that transitions to a state which is not in the counter example.
		// if you find such a state, then from that state. run the FINDPATHINCFG() method
		// and find out if that path returns to a state which IS in the counterexample.
		// If you find such a path, then that state is a branching state then you save this information for future use.
		//  **** REMEMBER THE CASE WHEN THERE ARE TWO OUTGOING BRANCHES FROM A STATE GOING IN THE SAME BRANCH ****
		for(int counter = 0; counter < counterexample.getLength(); counter++) // For all States LOOP WILL NEVER RUN
		{
			start_state = counterexample.getStateAtPosition(counter); // State in consideration at the moment.
			programpoint = ((ISLPredicate) start_state).getProgramPoint(); // Program point of the state under consideration.
			
			Iterable<OutgoingInternalTransition<CodeBlock, IPredicate>> succesors = cfg.internalSuccessors(hashmap.get(programpoint)); //Immediate successors of of the state in CFG
			Set<IPredicate> possibleEndPoints =  new HashSet<IPredicate>();  // all the successive states of the current state in the counter example
			Set<ProgramPoint> possibleEndPoints_programpoints = new HashSet<ProgramPoint>();
			for(int j=counter+1; j< size; j++)
			{
				possibleEndPoints.add( hashmap.get(((ISLPredicate)counterexample.getStateAtPosition(j)).getProgramPoint()) ); // Pushing all the successive states from the counter example
				possibleEndPoints_programpoints.add(((ISLPredicate) counterexample.getStateAtPosition(j)).getProgramPoint());
			}
			for( OutgoingInternalTransition<CodeBlock, IPredicate> test:succesors) // For all the immediate successor states of the state in focus
			{
				IPredicate succesor2 = test.getSucc(); // One of the successors of the the state in focus.
				if(((ISLPredicate)succesor2).getProgramPoint() != ((ISLPredicate)counterexample.getStateAtPosition(counter+1)).getProgramPoint()) // If this successor state is NOT the next state of the current state in the counter example
				{	
					int[] tuple = new int[2]; // Initialize tuple
					//m_Logger.warn("Found a state not in the counter example -->>" + succesor2);
					NestedRun<CodeBlock, IPredicate> path = findPathInCFG(succesor2, possibleEndPoints, cfg); // Path from the successor state not in the counter example till one of the states in the possible end points.
					//m_Logger.warn("Path -->  "+ path);
					if(path != null) // If such a path exists. Then that means that there is a path from the successor state that comes back to the counter example
					{ // THAT MEANS WE HAVE FOUND AN IF BRANCH AT POSITION "COUNTER" !!
						// Found an IF branch at position 1 of the counter example.
						int length = path.getLength();
						IPredicate last_state_of_the_path = path.getStateAtPosition(length-1);
						tuple[0] = counter; //Location of the OUT BRANCH in the counterexample.
						//// Computing the location of the IN-BRANCH					
						for(int j = 0; j<counterexample.getLength();j++)
						{
							IPredicate counter_example_state = counterexample.getStateAtPosition(j);
							ProgramPoint coun_ex_prog_point = ((ISLPredicate) counter_example_state).getProgramPoint();
							if((((ISLPredicate)last_state_of_the_path).getProgramPoint()).equals(coun_ex_prog_point))
							{
								tuple[1] = j; // Location of the state in the counter example where the branch ends
								//m_Logger.warn(" LAST STATE OF THE PATH -->> " + j);
							}
						}
						//// In-Branch Location computed.
						result.add(tuple);
						m_Logger.warn(" ");
					}
				}
			}
		}
		m_Logger.warn(" ");
		return result;
	}

	
	
	private void computeNONFlowSensitiveTraceFormula(IRun<CodeBlock, IPredicate> counterexampleRun,
		IPredicate falsePredicate, ModifiableGlobalVariableManager modGlobVarManager, SmtManager smtManager ) {
		
		NestedWord<CodeBlock> counterexampleWord = (NestedWord<CodeBlock>) counterexampleRun.getWord();
		PredicateTransformer pt = new PredicateTransformer(smtManager.getPredicateFactory(), smtManager.getVariableManager(), smtManager.getScript(), modGlobVarManager, m_Services);
		FaultLocalizationRelevanceChecker rc = new FaultLocalizationRelevanceChecker(smtManager.getManagedScript(), modGlobVarManager, smtManager.getBoogie2Smt());
		// Non-Flow Sensitive INCREMENTAL ANALYSIS
		m_Logger.warn("Initializing Non-Flow Sensitive INCREMENTAL ANALYSIS . . .");
		int backward_counter = counterexampleWord.length();
		//Relevency Information of the last statement
		//			IRelevanceInformation relevancy_of_statement = new RelevanceInformation();
		//			((RelevanceInformation) relevancy_of_statement).setStatement(counterexampleWord.getSymbolAt(backward_counter-1));
		//			Relevance_of_statements.add(relevancy_of_statement);
		// Calculating the WP-List
		final IterativePredicateTransformer ipt = new IterativePredicateTransformer(
				smtManager.getPredicateFactory(), smtManager.getVariableManager(), 
				smtManager.getScript(), smtManager.getBoogie2Smt(), modGlobVarManager, 
				m_Services, counterexampleWord, null, falsePredicate, null);
		
		final DefaultTransFormulas dtf = new DefaultTransFormulas(counterexampleWord, 
				null, falsePredicate, Collections.emptySortedMap(), modGlobVarManager, false);
		
		final InterpolantsPreconditionPostcondition weakestPreconditionSequence = 
				ipt.computeWeakestPreconditionSequence(dtf, Collections.emptyList());
		// End of the calculation
		
		for(int i = backward_counter-2 ; i >= 0; i--)
		{
			
				CodeBlock statement = counterexampleWord.getSymbolAt(i);
				IAction action = counterexampleWord.getSymbolAt(i);
				// Relevance Information.
						IRelevanceInformation relevancy_of_statement = Relevance_of_statements.get(i);
				//		((RelevanceInformation) relevancy_of_statement).setStatement(statement);
				// Calculate WP and PRE
				IPredicate wp = weakestPreconditionSequence.getInterpolant(i+1);
				IPredicate pre = smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionSequence.getInterpolant(i)));
				
				// Figure out what is the type of the statement (internal, call or Return) and act accordingly?
				ERelevanceStatus relevance = null;
				if(action instanceof IInternalAction)
				{
					IInternalAction internal = (IInternalAction) counterexampleWord.getSymbolAt(i);
					relevance = rc.relevanceInternal(pre, internal, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(wp)));
				}
				else if(action instanceof ICallAction)
				{
					ICallAction call = (ICallAction) counterexampleWord.getSymbolAt(i);
					relevance = rc.relevanceCall(pre, call, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(wp)));
				}
				else if(action instanceof IReturnAction)
				{
					IReturnAction returnn = (IReturnAction) counterexampleWord.getSymbolAt(i);
					assert counterexampleWord.isReturnPosition(i);
					assert !counterexampleWord.isPendingReturn(i) : "pending returns not supported";
					final int callPos = counterexampleWord.getCallPosition(i);
					final IPredicate callPredecessor = weakestPreconditionSequence.getInterpolant(callPos); 
					relevance = rc.relevanceReturn(pre, callPredecessor, returnn, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(wp)));
				}
				else
				{
					throw new AssertionError("Unknown Action " +
							action.getClass().getSimpleName());
				}
				
				
				if(relevance  == ERelevanceStatus.InUnsatCore) // This is the case when the the triple is unsatisfiable and the statment is in the Unsatisfiable core.
				{
					// SET CRITERIA 1 TO TRUE
					((RelevanceInformation) relevancy_of_statement).setCriteria1(true);
					
				}
				else if(relevance == ERelevanceStatus.Sat) // The case when we have HAVOC statements. In this case the statement is relevant if the triple is satisfiable.
				{
					((RelevanceInformation) relevancy_of_statement).setCriteria1(true);
				}
				else
				{
					// ToDo ! 
					// ADD here UNKNOWN ! after changing the criteria data type to ENUM.
				}
				// Adding relevance information in the array list Relevance_of_statements.
				//		Relevance_of_statements.add(relevancy_of_statement);
			
			
		}
		
		
			
			

		
	}
	
	private TransFormula BranchRelevanceChecker(int a, int b, IPredicate weakestPreconditionOld, NestedWord<CodeBlock> counterexampleWord, 
			SmtManager smtManager, ModifiableGlobalVariableManager modGlobVarManager){
		
		m_Logger.warn("Entered BranchRelevanceChecker");
		final PredicateTransformer pt = new PredicateTransformer(smtManager.getPredicateFactory(), smtManager.getVariableManager(), smtManager.getScript(), modGlobVarManager, m_Services);
		TransFormula combinedTransitionFormula = counterexampleWord.getSymbolAt(a).getTransitionFormula();
		final FaultLocalizationRelevanceChecker rc = new FaultLocalizationRelevanceChecker(smtManager.getManagedScript(), modGlobVarManager, smtManager.getBoogie2Smt());
		for(int i = a+1; i<=b; i++){
			final CodeBlock Statement = counterexampleWord.getSymbol(i);
			final TransFormula TransitionFormula = Statement.getTransitionFormula();
			combinedTransitionFormula = TransFormula.sequentialComposition(m_Logger, m_Services, smtManager.getBoogie2Smt(), false, false, false, combinedTransitionFormula,TransitionFormula);
		}
		final TransFormula markhor = TransFormula.computeMarkhorTransFormula(combinedTransitionFormula, smtManager.getBoogie2Smt(), m_Services, m_Logger);
		final IPredicate weakestPreconditionNew = pt.weakestPrecondition(weakestPreconditionOld, markhor);
		final IPredicate pre = smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionNew));
		final String preceeding = counterexampleWord.getSymbolAt(a-1).getPreceedingProcedure();
		final String succeeding = counterexampleWord.getSymbolAt(b+1).getSucceedingProcedure();
		counterexampleWord.getSubWord(a, b);
		final BasicInternalAction basic = new BasicInternalAction(preceeding, succeeding, markhor); // [[ IS THIS OK ? Check with Matthias. ]] Because this action is for the whole markhor formula

		final ERelevanceStatus relevance = rc.relevanceInternal(pre, basic, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionOld)));
		if(relevance == ERelevanceStatus.InUnsatCore || relevance == ERelevanceStatus.Sat){ // Branch is RELEVANT
			return markhor;
		}
		else{ // BRANCH IS NOT RELEVANT
			return null;
		}
	}
	
	
	private ArrayList<CodeBlock> relevantFlowSensitiveStatements(NestedWord<CodeBlock> counterexampleWord, int start_location, int end_location,
			IPredicate weakestPreconditionOld, IPredicate weakestPreconditionNew, PredicateTransformer pt, FaultLocalizationRelevanceChecker rc, 
			SmtManager smtManager, ModifiableGlobalVariableManager modGlobVarManager, ArrayList<int[]> informationFromCFG){
		
		m_Logger.warn("Entered relevant FlowSensitiveStatements");
		ArrayList <CodeBlock> relevantStatements = new ArrayList();
		IPredicate weakestPreconditionTemp = null;
		IPredicate pre = null;
		ERelevanceStatus relevance;
		for ( int backwardcounter = end_location; backwardcounter >= start_location ; backwardcounter -- ){
			final CodeBlock Statement = counterexampleWord.getSymbol(backwardcounter);
			int flag = 0;
			int branch_out = 0;
			int branch_in = 0;
			// Find out if the current Statement is a BRANCH-IN statement.
			for(int j =0; j< informationFromCFG.size() ; j++){
				if(backwardcounter == informationFromCFG.get(j)[1]-1){
					flag = 1; // Yes it is a Branch-IN statement.
					branch_out = informationFromCFG.get(j)[0];
					branch_in = informationFromCFG.get(j)[1]-1;
					backwardcounter = branch_out; // Go one step behind the branch
					informationFromCFG.remove(j);
					break;
				}
			}
			if(flag == 1){ // The current statement is a BRANCH-IN Statement.
			
				// Check the relevancy of the branch ?
				final TransFormula markhor_formula =  BranchRelevanceChecker(branch_out,branch_in,weakestPreconditionNew,counterexampleWord,smtManager,modGlobVarManager);
				if(markhor_formula != null){ // If the branch is Relevant.
					//Recursion
					ArrayList<CodeBlock> relevantSubStatements = relevantFlowSensitiveStatements(counterexampleWord, branch_out,branch_in,weakestPreconditionNew,weakestPreconditionNew,pt,rc,smtManager,modGlobVarManager,informationFromCFG);
					relevantStatements.addAll(relevantSubStatements);
					weakestPreconditionNew = pt.weakestPrecondition(weakestPreconditionNew, markhor_formula); // If the branch is relevant, then we take the calculate the 
																								// new WP by taking the markhor formula into consideration.
				}
				else{
					m_Logger.warn("Branch not relevant, do nothing.");
				}
				// If the branch is relevant, then recursively call the same function on it self with the updated parameters.
				// If the branch is not relevant, then just ignore the branch and update the backward counter and also take a look what should you do with the pre and wp.
				m_Logger.warn("break");

			}
			else{ // The statement under consideration is NOT a BRANCH-IN Statement.
			
				final IRelevanceInformation relevancy_of_statement = Relevance_of_statements.get(backwardcounter);
				weakestPreconditionOld = weakestPreconditionNew;
				weakestPreconditionNew = pt.weakestPrecondition(weakestPreconditionOld, counterexampleWord.getSymbolAt(backwardcounter).getTransitionFormula());
				pre = smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionNew));
				final IAction action = counterexampleWord.getSymbolAt(backwardcounter);
				if(action instanceof IInternalAction)
				{
					final IInternalAction internal = (IInternalAction) counterexampleWord.getSymbolAt(backwardcounter);
					relevance = rc.relevanceInternal(pre, internal, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionOld)));
				}
				else if(action instanceof ICallAction){
					ICallAction call = (ICallAction) counterexampleWord.getSymbolAt(backwardcounter);
					relevance = rc.relevanceCall(pre, call, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionOld)));
				}
				else if(action instanceof IReturnAction){
					IReturnAction returnn = (IReturnAction) counterexampleWord.getSymbolAt(backwardcounter);
					assert counterexampleWord.isReturnPosition(backwardcounter);
					assert !counterexampleWord.isPendingReturn(backwardcounter) : "pending returns not supported";
					final int callPos = counterexampleWord.getCallPosition(backwardcounter);
					final IPredicate callPredecessor = weakestPreconditionNew; 
					relevance = rc.relevanceReturn(pre, callPredecessor, returnn, smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().not(weakestPreconditionOld)));
				}
				else{
					throw new AssertionError("Unknown Action " +
							action.getClass().getSimpleName());
				}
				
				
				if(relevance == ERelevanceStatus.InUnsatCore || relevance == ERelevanceStatus.Sat){
					relevantStatements.add(Statement);
					((RelevanceInformation) relevancy_of_statement).setCriteria2(true);
					// RELEVANT With respect to the flow sensitive analysis !
				}
				else{
					m_Logger.warn("Not Relevant");
					//Not relevant
				}		
			}
		}
		return(relevantStatements);
		
		
	}
	
	private void computeFlowSensitiveTraceFormula(IRun<CodeBlock, IPredicate> counterexampleRun,
			IPredicate falsePredicate, ModifiableGlobalVariableManager modGlobVarManager, SmtManager smtManager 
			, ArrayList<int[]> informationFromCFG ){
	
	
	m_Logger.warn("Initializing Flow Sensitive Fault Localization");
	// You should send the counter example, the CFG information and the the start of the branch and the end of the branch.
	NestedWord<CodeBlock> counterexampleWord = (NestedWord<CodeBlock>) counterexampleRun.getWord();
	PredicateTransformer pt = new PredicateTransformer(smtManager.getPredicateFactory(), smtManager.getVariableManager(), smtManager.getScript(), modGlobVarManager, m_Services);
	FaultLocalizationRelevanceChecker rc = new FaultLocalizationRelevanceChecker(smtManager.getManagedScript(), modGlobVarManager, smtManager.getBoogie2Smt());
	int start_location = 0;
	int end_location = counterexampleWord.length()-1;
	IPredicate weakestPreconditionOld = smtManager.getPredicateFactory().newPredicate(smtManager.getPredicateFactory().constructFalse());
	IPredicate weakestPreconditionNew = weakestPreconditionOld;
	ArrayList<CodeBlock> rel_Statements = relevantFlowSensitiveStatements(counterexampleWord,start_location, end_location,weakestPreconditionOld,weakestPreconditionNew, pt, rc, smtManager,modGlobVarManager, informationFromCFG);
	m_Logger.warn("Break");
	

}
	

	/**
	 * Check if there is a path from startPoint so some element of the 
	 * possibleEndPoints set.
	 * If yes, a NestedRun is returned, otherwise null is returned.
	 * 
	 * @throws ToolchainCanceledException if toolchain was cancelled (e.g., 
	 * because of a timeout)
	 */
	private NestedRun<CodeBlock, IPredicate> findPathInCFG(IPredicate startPoint, 
			Set<IPredicate> possibleEndPoints, INestedWordAutomaton<CodeBlock, 
			IPredicate> cfg){

		
		try {
			return (new IsEmpty<CodeBlock, IPredicate>(new AutomataLibraryServices(m_Services), cfg, 
					Collections.singleton(startPoint), possibleEndPoints)).getNestedRun();
		} 
		
		catch (OperationCanceledException e) {
			throw new ToolchainCanceledException(getClass());
		}
	}
	
	/**
	 * @return List of {@link RelevanceInformation}s one for each 
	 * {@link CodeBlock} in the counterexample.
	 */
	public ArrayList<IRelevanceInformation> getRelevanceInformation() {
		//for(int i= 0;i <Relevance_of_statements.size()/2;i++) // Flipping the array
		//{
		//	IRelevanceInformation temp = Relevance_of_statements.get(i);
		//	Relevance_of_statements.set(i, Relevance_of_statements.get(Relevance_of_statements.size()-i-1));
		//	Relevance_of_statements.set(Relevance_of_statements.size()-i-1, temp);
		//}
		m_Logger.warn("- - - - - - - -");
		for(int i= 0;i <Relevance_of_statements.size();i++){
			m_Logger.warn(((RelevanceInformation) Relevance_of_statements.get(i)).getStatement() +" | " +Relevance_of_statements.get(i).getShortString());
		}
		return Relevance_of_statements;
	}
	
}
