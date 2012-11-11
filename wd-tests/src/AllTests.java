package WasaviTest;

import org.junit.runner.JUnitCore;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.junit.runners.Suite.SuiteClasses;

@RunWith(Suite.class) @SuiteClasses({
	BasicsTest.class
//	,EditingTest.class
//	,MotionsTest.class
//	,UndoTest.class
//	,ExCommandsTest.class
//	,ScrollersTest.class
//	,OpChangeTest.class
//	,OpDeleteTest.class
//	,OpYankTest.class
//	,OpShiftTest.class
	,RangeSymbolsTest.class
	,LearningTheViEditor6th.class
})
public class AllTests {
	public static void main (String[] args) {
		JUnitCore.main(AllTests.class.getName());
	}
}
