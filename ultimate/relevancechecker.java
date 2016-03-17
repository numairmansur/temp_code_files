/*
 * Copyright (C) 2016 Matthias Heizmann (heizmann@informatik.uni-freiburg.de)
 * Copyright (C) 2016 University of Freiburg
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
package de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates;

import de.uni_freiburg.informatik.ultimate.logic.ApplicationTerm;
import de.uni_freiburg.informatik.ultimate.logic.Term;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.boogie.ModifiableGlobalVariableManager;
import de.uni_freiburg.informatik.ultimate.modelcheckerutils.smt.predicates.IPredicate;
import de.uni_freiburg.informatik.ultimate.plugins.generator.rcfgbuilder.cfg.CodeBlock;
import de.uni_freiburg.informatik.ultimate.plugins.generator.traceabstraction.predicates.IHoareTripleChecker.Validity;

/**
 * Checks the relevance of a <code>CodeBlock</code> with respect to a pre- and a
 * postcondition. The check is reduced to a Hoare triple check.
 * 
 * @author Christian Schilling <schillic@informatik.uni-freiburg.de>
 * @author Matthias Heizmann (heizmann@informatik.uni-freiburg.de)
 */
public class FaultLocalizationRelevanceChecker {
	/**
	 * Statement relevance information for fault localization.
	 * 
	 * @author Christian Schilling <schillic@informatik.uni-freiburg.de>
	 */
	public enum ERelevanceStatus {
		Sat,
		InUnsatCore,
		NotInUnsatCore,
		unknown
	}
	
	/**
	 * Used by Fault Localization to compute the relevance of statements.
	 * 
	 * @author Christian Schilling <schillic@informatik.uni-freiburg.de>
	 */
	private class FaultLocalizationHoareTripleChecker
			extends IncrementalHoareTripleChecker {
		
		public FaultLocalizationHoareTripleChecker(SmtManager smtManager,
				ModifiableGlobalVariableManager modGlobVarManager) {
			super(smtManager, modGlobVarManager);
		}
		
		@Override
		public Validity checkInternal(IPredicate pre, CodeBlock cb, IPredicate post) {
			prepareAssertionStackAndAddTransition(cb);
			prepareAssertionStackAndAddPrecondition(pre);
			prepareAssertionStackAndAddPostcond(post);
			return checkValidity();
		}
		
		@Override
		public Validity checkCall(IPredicate pre, CodeBlock cb, IPredicate post) {
			prepareAssertionStackAndAddTransition(cb);
			prepareAssertionStackAndAddPrecondition(pre);
			prepareAssertionStackAndAddPostcond(post);
			return checkValidity();
		}
		
		@Override
		public Validity checkReturn(IPredicate linPre, IPredicate hierPre,
				CodeBlock cb, IPredicate postcond) {
			prepareAssertionStackAndAddTransition(cb);
			prepareAssertionStackAndAddPrecondition(linPre);
			prepareAssertionStackAndAddHierpred(hierPre);
			prepareAssertionStackAndAddPostcond(postcond);
			return checkValidity();
		}
		
		public boolean doesUnsatCoreContainTransition() {
			Term[] unsatCore = m_Script.getUnsatCore();
			for (Term term : unsatCore) {
				ApplicationTerm appTerm = (ApplicationTerm) term;
				if (appTerm.getFunction().getName().equals(IncrementalHoareTripleChecker.s_IdTransitionFormula)) {
					return true;
				}
			}
			return false;
		}
	}
	
	private final FaultLocalizationHoareTripleChecker mHoareTripleChecker;
	
	public FaultLocalizationRelevanceChecker(final SmtManager smtManager,
			final ModifiableGlobalVariableManager modGlobVarManager) {
		this.mHoareTripleChecker = new FaultLocalizationHoareTripleChecker(
				smtManager, modGlobVarManager);
	}
	
	public ERelevanceStatus relevanceInternal(final IPredicate pre,
			final CodeBlock cb, final IPredicate succ) {
		// TODO negate succ? no!
		final Validity val = mHoareTripleChecker.checkInternal(pre, cb, succ);
		
		return getResult(val, mHoareTripleChecker);
	}
	
	/**
	 * @param val validity status from Hoare triple check
	 * @param hoareTripleChecker
	 * @return relevance
	 */
	private ERelevanceStatus getResult(final Validity val,
			final FaultLocalizationHoareTripleChecker hoareTripleChecker) {
		final ERelevanceStatus result;
		switch (val) {
			case INVALID: // satisfiable
				result = ERelevanceStatus.Sat;
				break;
				
			case VALID: // unsatisfiable, check unsat core
				boolean ucContainsTransition = hoareTripleChecker.doesUnsatCoreContainTransition();
				result = ucContainsTransition
						? ERelevanceStatus.InUnsatCore
						: ERelevanceStatus.NotInUnsatCore;
				break;
				
			case UNKNOWN:
				result = ERelevanceStatus.unknown;
				break;
				
			case NOT_CHECKED:
			default:
				throw new IllegalArgumentException(String.format(
						"Hoare triple check returned status '%s'.", val));
		}
		return result;
	}
}
