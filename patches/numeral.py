def arabic_to_farsi(number):
    """
    Convert Arabic digits in a string to Farsi/Persian digits.

    Args:
        number (str or int): The number or string containing Arabic digits.

    Returns:
        str: The input string with Arabic digits replaced by Farsi digits.
    """

    # Convert number to string if it's not already
    if not isinstance(number, str):
        number = str(number)

    # Define Arabic and Farsi digit strings
    arabic_digits = '0123456789'
    farsi_digits = '۰۱۲۳۴۵۶۷۸۹'

    # Create a translation mapping using str.maketrans
    mapping = str.maketrans(arabic_digits, farsi_digits)

    # Translate Arabic digits to Farsi digits in the given number string
    farsi_number = str(number).translate(mapping)

    return farsi_number
