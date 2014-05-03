Feature: Sum
	I want to be able to add numbers

	Scenario: Adding two numbers
		Given the number 1 is my first number
			And the number 2 is my second number
		When I add the numbers
		Then the result should be the sum should be 3